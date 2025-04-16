const { QueryTypes, Op} = require('sequelize');

const e = require("express");
const CustomerInteraction = require("../models/customerInteraction");
const ActualCollectionModel=require("../models/actualCollecttion")
const { AssignedLoans, ActiveOfficers, DueLoanData,UserInformations,DistrictList, BranchList } = require("../models");


const { Sequelize, where } = require("sequelize");
const CollectionModel = require("../models/collectionModel");
const sequelize = require("../db/db"); // Import your Sequelize instance
const { stat } = require("fs");



async function getCollectionStatistics(req, res) {
    try {

        const getSummaryStats = async (startDate = null, endDate = null, product_type=null) => {
            const productTypeCondition = product_type 
                ? `AND due_loan_datas.product_type = :productType`
                : '';

            const summaryStats = await sequelize.query(`
                WITH MaxDateInfo AS (
                    -- Get the maximum collection date from actual_collection_data
                    SELECT 
                        MAX(acd.collection_date) AS max_date,
                        DATE(MAX(acd.collection_date)) AS max_date_only
                    FROM actual_collection_data acd
                ),
                DueLoans AS (
                    -- Select only loans that exist in due_loan_datas
                    SELECT DISTINCT loan_id FROM due_loan_datas
                    WHERE 1=1
                    ${productTypeCondition}
                ),


                ClosedLoans AS (
                    -- Get loans that are marked as "Closed" and exist in due_loan_datas
                    -- Only for the max date
                    SELECT DISTINCT acd.loan_id
                    FROM actual_collection_data acd
                    JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                    JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
                    WHERE acd.application_status = 'Closed'
                ),
                ClosedLoanSummary AS (
                    -- Sum collected amounts for Closed Loans on the max date
                    SELECT 
                        COALESCE(SUM(acd.total_collected), 0) AS closed_total_collected,
                        COALESCE(SUM(acd.penalty_collected), 0) AS closed_penalty_collected,
                        COALESCE(SUM(acd.principal_collected), 0) AS closed_principal_collected,
                        COALESCE(SUM(acd.interest_collected), 0) AS closed_interest_collected
                    FROM actual_collection_data acd
                    JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
                    JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
                ),
                ActiveLoanSummary AS (
                    -- Sum collected amounts for Active Loans (excluding Closed Loans) on the max date
                    SELECT 
                        COALESCE(SUM(acd.total_collected), 0) AS active_total_collected,
                        COALESCE(SUM(acd.penalty_collected), 0) AS active_penalty_collected,
                        COALESCE(SUM(acd.principal_collected), 0) AS active_principal_collected,
                        COALESCE(SUM(acd.interest_collected), 0) AS active_interest_collected
                    FROM actual_collection_data acd
                    JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                    JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
                    WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
                ),
                OverallSummary AS (
                    -- Sum collected amounts for ALL loans in due_loan_datas on the max date
                    SELECT 
                        COALESCE(SUM(acd.total_collected), 0) AS overall_total_collected,
                        COALESCE(SUM(acd.penalty_collected), 0) AS overall_penalty_collected,
                        COALESCE(SUM(acd.principal_collected), 0) AS overall_principal_collected,
                        COALESCE(SUM(acd.interest_collected), 0) AS overall_interest_collected
                    FROM actual_collection_data acd
                    JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                    JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
                )
                SELECT 
                    cs.closed_total_collected,
                    cs.closed_penalty_collected,
                    cs.closed_principal_collected,
                    cs.closed_interest_collected,
                    asum.active_total_collected,
                    asum.active_penalty_collected,
                    asum.active_principal_collected,
                    asum.active_interest_collected,
                    os.overall_total_collected,
                    os.overall_penalty_collected,
                    os.overall_principal_collected,
                    os.overall_interest_collected,
                    (SELECT max_date_only FROM MaxDateInfo) AS collection_date
                FROM ClosedLoanSummary cs
                CROSS JOIN ActiveLoanSummary asum
                CROSS JOIN OverallSummary os`,
                {
                    replacements: {
                        ...(productType && { productType: productType })
                    },
                    type: QueryTypes.SELECT
                }
            );

            function getLastWeekDateRange() {
              const currentDate = new Date();
              
              let date = new Date(currentDate);
              
              let day = date.getDay();
              
              let daysToSubtract = day === 0 ? 6 : day + 6;
              
              // Set date to previous week's Monday
              date.setDate(date.getDate() - daysToSubtract);
              let previousMondayDate = new Date(date);
              let lastWeekEnd = new Date(date);
              lastWeekEnd.setDate(date.getDate() + 6);
              
              return {
                startDate: previousMondayDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
                endDate: lastWeekEnd.toISOString().split('T')[0]           // Format: YYYY-MM-DD
              };
            }
            
            // Example of using this with your SQL query
            async function getWeeklyStatistics() {
              // Get last week's date range

              
              const { startDate, endDate } = getLastWeekDateRange();
              const productTypeCondition = product_type 
              ? `AND due_loan_datas.product_type = :productType`
              : '';
              // Use the date range in your SQL query
              const WeeklyStatistics = await sequelize.query(`

                
                WITH DateRange AS (
                  -- Use last week's date range
                  SELECT 
                      :startDate AS start_date,
                      :endDate AS end_date
                ),
                DueLoans AS (
                    -- Select only loans that exist in due_loan_datas
                    SELECT DISTINCT loan_id FROM due_loan_datas
                    WHERE 1=1
                    ${productTypeCondition}
                ),
                ClosedLoans AS (
                  -- Get loans that are marked as "Closed" and exist in due_loan_datas
                  -- Within the date range
                  SELECT DISTINCT acd.loan_id
                  FROM actual_collection_data acd
                  JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                  WHERE acd.application_status = 'Closed'
                ),
                -- Rest of your query remains the same...
                ClosedLoanSummary AS (
                  SELECT 
                      COALESCE(SUM(acd.total_collected), 0) AS closed_total_collected,
                      COALESCE(SUM(acd.penalty_collected), 0) AS closed_penalty_collected,
                      COALESCE(SUM(acd.principal_collected), 0) AS closed_principal_collected,
                      COALESCE(SUM(acd.interest_collected), 0) AS closed_interest_collected
                  FROM actual_collection_data acd
                  JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                ),
                ActiveLoanSummary AS (
                  SELECT 
                      COALESCE(SUM(acd.total_collected), 0) AS active_total_collected,
                      COALESCE(SUM(acd.penalty_collected), 0) AS active_penalty_collected,
                      COALESCE(SUM(acd.principal_collected), 0) AS active_principal_collected,
                      COALESCE(SUM(acd.interest_collected), 0) AS active_interest_collected
                  FROM actual_collection_data acd
                  JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                  WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
                ),
                OverallSummary AS (
                  SELECT 
                      COALESCE(SUM(acd.total_collected), 0) AS overall_total_collected,
                      COALESCE(SUM(acd.penalty_collected), 0) AS overall_penalty_collected,
                      COALESCE(SUM(acd.principal_collected), 0) AS overall_principal_collected,
                      COALESCE(SUM(acd.interest_collected), 0) AS overall_interest_collected
                  FROM actual_collection_data acd
                  JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                )
                SELECT 
                  cs.closed_total_collected,
                  cs.closed_penalty_collected,
                  cs.closed_principal_collected,
                  cs.closed_interest_collected,
                  asum.active_total_collected,
                  asum.active_penalty_collected,
                  asum.active_principal_collected,
                  asum.active_interest_collected,
                  os.overall_total_collected,
                  os.overall_penalty_collected,
                  os.overall_principal_collected,
                  os.overall_interest_collected,
                  :startDate AS start_date,
                  :endDate AS end_date
                FROM ClosedLoanSummary cs
                CROSS JOIN ActiveLoanSummary asum
                CROSS JOIN OverallSummary os`,
                {
                  replacements: {
                    startDate: startDate,
                    endDate: endDate,
                    ...(productType && { productType: productType })
                  },
                  type: QueryTypes.SELECT
                }
              );
              
              return WeeklyStatistics;
            }



            const generalStats = await sequelize.query(`
                SELECT 
                    -- Total calls (total table content)
                    COUNT(*) as total_calls,
                    
                    -- Call status statistics
                    COUNT(CASE WHEN call_status = 'Contacted' THEN 1 END) as total_contacted_calls,
                    COUNT(CASE WHEN call_status = 'Not contacted' THEN 1 END) as total_not_contacted_calls,
                    
                    -- Unique customers statistics
                    COUNT(DISTINCT loan_id) as total_unique_customers,
                    COUNT(DISTINCT CASE WHEN call_status = 'Contacted' THEN loan_id END) as unique_contacted_customers,
                    
                    -- Modified: Only count loan_ids that have NEVER been contacted
                    (SELECT COUNT(DISTINCT ci1.loan_id) 
                     FROM customer_interactions ci1 
                     WHERE NOT EXISTS (
                         SELECT 1 FROM customer_interactions ci2 
                         WHERE ci2.loan_id = ci1.loan_id 
                         AND ci2.call_status = 'Contacted'
                         ${startDate && endDate ? 'AND ci2.date BETWEEN :startDate AND :endDate' : ''}
                     )
                     ${startDate && endDate ? 'AND ci1.date BETWEEN :startDate AND :endDate' : ''}
                    ) as unique_not_contacted_customers,
                    
                    -- Payment statistics - overall
                    (SELECT COUNT(DISTINCT ac.loan_id) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci.loan_id 
                        FROM customer_interactions ci 
                        WHERE 1=1 ${startDate && endDate ? 'AND ci.date BETWEEN :startDate AND :endDate' : ''}
                    )) as total_customers_paid,
                    
                    -- Total amount paid - overall
                    (SELECT SUM(ac.total_collected) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci.loan_id 
                        FROM customer_interactions ci 
                        WHERE 1=1 ${startDate && endDate ? 'AND ci.date BETWEEN :startDate AND :endDate' : ''}
                    )) as total_amount_paid,
                    
                    -- Payment statistics - for contacted customers
                    (SELECT COUNT(DISTINCT ac.loan_id) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci.loan_id 
                        FROM customer_interactions ci 
                        WHERE ci.call_status = 'Contacted' 
                        ${startDate && endDate ? 'AND ci.date BETWEEN :startDate AND :endDate' : ''}
                    )) as contacted_customers_paid,
                    
                    -- Total amount paid - for contacted customers
                    (SELECT SUM(ac.total_collected) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci.loan_id 
                        FROM customer_interactions ci 
                        WHERE ci.call_status = 'Contacted' 
                        ${startDate && endDate ? 'AND ci.date BETWEEN :startDate AND :endDate' : ''}
                    )) as contacted_amount_paid,
                    
                    -- Modified: Payment statistics - for truly not contacted customers
                    (SELECT COUNT(DISTINCT ac.loan_id) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci1.loan_id 
                        FROM customer_interactions ci1
                        WHERE NOT EXISTS (
                            SELECT 1 FROM customer_interactions ci2 
                            WHERE ci2.loan_id = ci1.loan_id 
                            AND ci2.call_status = 'Contacted'
                            ${startDate && endDate ? 'AND ci2.date BETWEEN :startDate AND :endDate' : ''}
                        )
                        ${startDate && endDate ? 'AND ci1.date BETWEEN :startDate AND :endDate' : ''}
                    )) as not_contacted_customers_paid,
                    
                    -- Modified: Total amount paid - for truly not contacted customers
                    (SELECT SUM(ac.total_collected) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci1.loan_id 
                        FROM customer_interactions ci1
                        WHERE NOT EXISTS (
                            SELECT 1 FROM customer_interactions ci2 
                            WHERE ci2.loan_id = ci1.loan_id 
                            AND ci2.call_status = 'Contacted'
                            ${startDate && endDate ? 'AND ci2.date BETWEEN :startDate AND :endDate' : ''}
                        )
                        ${startDate && endDate ? 'AND ci1.date BETWEEN :startDate AND :endDate' : ''}
                    )) as not_contacted_amount_paid
                FROM customer_interactions ci
                WHERE 1=1 ${startDate && endDate ? 'AND ci.date BETWEEN :startDate AND :endDate' : ''}
            `, {
                replacements: {
                    startDate,
                    endDate
                },
                type: QueryTypes.SELECT
            });            

            function getLastMonthDateRange() {
                // Get current date
                const currentDate = new Date();
                
                // Get current month and year
                const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
                const currentYear = currentDate.getFullYear();
                const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                
                // First day of previous month: set to 1st day of the previous month
                const firstDayPreviousMonth = new Date(previousMonthYear, previousMonth, 1);
                const lastDayPreviousMonth = new Date(currentYear, currentMonth, 0);
                
                // Format dates as YYYY-MM-DD strings
                const startDate = firstDayPreviousMonth.toISOString().split('T')[0];
                const endDate = lastDayPreviousMonth.toISOString().split('T')[0];
                return { startDate, endDate };
              }
            // Example of using this with your SQL query
            async function getMonthlyStatistics() {
              // Get last month's date range
              const { startDate, endDate } = getLastMonthDateRange();

              const productTypeCondition = product_type 
              ? `AND due_loan_datas.product_type = :productType`
              : '';

              const summaryStats = await sequelize.query(`
                WITH DateRange AS (
                  -- Use last month's date range
                  SELECT 
                      :startDate AS start_date,
                      :endDate AS end_date
                ),
                DueLoans AS (
                    -- Select only loans that exist in due_loan_datas
                    SELECT DISTINCT loan_id FROM due_loan_datas
                    WHERE 1=1
                    ${productTypeCondition}
                ),
                ClosedLoans AS (
                  -- Get loans that are marked as "Closed" and exist in due_loan_datas
                  -- Within the date range
                  SELECT DISTINCT acd.loan_id
                  FROM actual_collection_data acd
                  JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                  WHERE acd.application_status = 'Closed'
                ),
                ClosedLoanSummary AS (
                  SELECT 
                      COALESCE(SUM(acd.total_collected), 0) AS closed_total_collected,
                      COALESCE(SUM(acd.penalty_collected), 0) AS closed_penalty_collected,
                      COALESCE(SUM(acd.principal_collected), 0) AS closed_principal_collected,
                      COALESCE(SUM(acd.interest_collected), 0) AS closed_interest_collected
                  FROM actual_collection_data acd
                  JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                ),
                ActiveLoanSummary AS (
                  SELECT 
                      COALESCE(SUM(acd.total_collected), 0) AS active_total_collected,
                      COALESCE(SUM(acd.penalty_collected), 0) AS active_penalty_collected,
                      COALESCE(SUM(acd.principal_collected), 0) AS active_principal_collected,
                      COALESCE(SUM(acd.interest_collected), 0) AS active_interest_collected
                  FROM actual_collection_data acd
                  JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                  WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
                ),
                OverallSummary AS (
                  SELECT 
                      COALESCE(SUM(acd.total_collected), 0) AS overall_total_collected,
                      COALESCE(SUM(acd.penalty_collected), 0) AS overall_penalty_collected,
                      COALESCE(SUM(acd.principal_collected), 0) AS overall_principal_collected,
                      COALESCE(SUM(acd.interest_collected), 0) AS overall_interest_collected
                  FROM actual_collection_data acd
                  JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                  JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
                )
                SELECT 
                  cs.closed_total_collected,
                  cs.closed_penalty_collected,
                  cs.closed_principal_collected,
                  cs.closed_interest_collected,
                  asum.active_total_collected,
                  asum.active_penalty_collected,
                  asum.active_principal_collected,
                  asum.active_interest_collected,
                  os.overall_total_collected,
                  os.overall_penalty_collected,
                  os.overall_principal_collected,
                  os.overall_interest_collected,
                  :startDate AS start_date,
                  :endDate AS end_date
                FROM ClosedLoanSummary cs
                CROSS JOIN ActiveLoanSummary asum
                CROSS JOIN OverallSummary os`,
                {
                  replacements: {
                    startDate: startDate,
                    endDate: endDate,
                    ...(productType && { productType: productType })
                  },
                  type: QueryTypes.SELECT
                }
              );
              
              return summaryStats;
            }

                            // If no results, return zeros for all fields
            const defaultStats = {
                closed_total_collected: 0,
                closed_penalty_collected: 0,
                closed_principal_collected: 0,
                closed_interest_collected: 0,
                active_total_collected: 0,
                active_penalty_collected: 0,
                active_principal_collected: 0,
                active_interest_collected: 0,
                overall_total_collected: 0,
                overall_penalty_collected: 0,
                overall_principal_collected: 0,
                overall_interest_collected: 0,
                collection_date: null
            };

            const result = summaryStats.length > 0 ? summaryStats[0] : defaultStats;
            const generalStatsResult = generalStats.length > 0 ? generalStats[0] : {
                total_calls: 0,
                total_contacted_calls: 0,
                total_not_contacted_calls: 0,
                total_unique_customers: 0,
                unique_contacted_customers: 0,
                unique_not_contacted_customers: 0,
                total_customers_paid: 0,
                total_amount_paid: 0,
                contacted_customers_paid: 0,
                contacted_amount_paid: 0,
                not_contacted_customers_paid: 0,
                not_contacted_amount_paid: 0
            };



            const weeklyStats = await getWeeklyStatistics();

            const monthlyStats = await getMonthlyStatistics();

            return {summaryStats:result, generalStats:generalStatsResult,
                weeklyStats:weeklyStats[0], monthlyStats:monthlyStats[0],}
        };
        
        const { startDate, endDate,productType } = req.body;

        
        // Validate dates if provided
        if ((startDate && !endDate) || (!startDate && endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Both startDate and endDate are required for date filtering'
            });
        }



        // function getDateRange(startDate, endDate) {
        //     // Parse the dates
        //     const start = new Date(startDate);
        //     const end = new Date(endDate);
            
        //     // Set time to beginning of day for start date
        //     start.setHours(0, 0, 0, 0);
            
        //     // Set time to end of day for end date
        //     end.setHours(23, 59, 59, 999);
            
        //     return { 
        //         startDate: start.toISOString(), 
        //         endDate: end.toISOString() 
        //     };
        // }



        // function getDateRange(startDate, endDate) {
        //     // Parse the dates and create them in local timezone
        //     const start = new Date(startDate);
        //     const end = new Date(endDate);
            
        //     // Create dates for start and end of day in local timezone
        //     const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        //     const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
            
        //     return {
        //         startDate: startOfDay.toISOString(),
        //         endDate: endOfDay.toISOString()
        //     };
        // }  
        
        
        function getDateRange(startDate, endDate) {
            // Method 2: Using toLocaleDateString
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return {
                startDate: start.toLocaleDateString('en-CA'), // 'en-CA' gives "YYYY-MM-DD" format
                endDate: end.toLocaleDateString('en-CA')
            };
        }

        const dateRange = startDate ? getDateRange(startDate, endDate) : null;
        const parsedStartDate = dateRange?.startDate || null;
        const parsedEndDate = dateRange?.endDate || null;
        const parsedProductType = productType || null;
        // Validate date format

        if (startDate && endDate) {

            // Ensure startDate is before endDate
            if (parsedStartDate > parsedEndDate) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate must be before endDate'
                });
            }
        }

        const { summaryStats, generalStats,weeklyStats,monthlyStats }= await getSummaryStats(parsedStartDate, parsedEndDate, parsedProductType);

        const getOfficerStatistics = async (startDate = null, endDate = null, prodcutType=null) => {
            const dateCondition = startDate && endDate 
                ? 'AND ci.date BETWEEN :startDate AND :endDate' 
                : '';

            const collectiondateCondition = startDate && endDate 
                ? 'AND acd.collection_date BETWEEN :startDate AND :endDate' 
                : '';
            
            const productTypeCondition = prodcutType 
                ? `AND dld.product_type = :productType`
                : '';
        
            const statistics = await Promise.all([
                // Get officer information along with statistics
                sequelize.query(`
                    SELECT 
                        ci.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(CASE WHEN ci.call_status = 'Contacted' THEN 1 END) as total_contacted,
                        COUNT(CASE WHEN ci.call_status = 'Not contacted' THEN 1 END) as total_not_contacted,
                        COUNT(DISTINCT CASE WHEN ci.call_status = 'Contacted' THEN ci.loan_id END) as unique_contacted_loans,
                        COUNT(DISTINCT CASE WHEN ci.call_status = 'Not contacted' THEN ci.loan_id END) as unique_not_contacted_loans,
                        COUNT(DISTINCT ci.loan_id) as total_unique_loans
                    FROM customer_interactions ci
                    LEFT JOIN user_informations ui ON ci.officer_id = ui.userId
                    WHERE 1=1 
                    ${dateCondition}
                    GROUP BY ci.officer_id, ui.userName, ui.fullName
                `, {
                    replacements: {
                        ...(startDate && endDate && { startDate, endDate })
                    },
                    type: QueryTypes.SELECT
                }),
            
                // Never contacted loans count by officer
                sequelize.query(`
                    SELECT 
                        ci1.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(DISTINCT ci1.loan_id) as count
                    FROM customer_interactions ci1
                    LEFT JOIN user_informations ui ON ci1.officer_id = ui.userId
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM customer_interactions ci2
                        WHERE ci2.loan_id = ci1.loan_id 
                        AND ci2.call_status = :contactedStatus
                        ${dateCondition.replace(/ci\./g, 'ci2.')}
                    )
                    ${dateCondition.replace(/ci\./g, 'ci1.')}
                    GROUP BY ci1.officer_id, ui.userName, ui.fullName`,
                    {
                        replacements: { 
                            contactedStatus: 'Contacted',
                            ...(startDate && endDate && { startDate, endDate })
                        },
                        type: QueryTypes.SELECT
                    }
                ),
            
                // Never contacted loans with "Not contacted" status by officer
                sequelize.query(`
                    SELECT 
                        ci1.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(DISTINCT ci1.loan_id) as count
                    FROM customer_interactions ci1
                    LEFT JOIN user_informations ui ON ci1.officer_id = ui.userId
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM customer_interactions ci2
                        WHERE ci2.loan_id = ci1.loan_id 
                        AND ci2.call_status = :contactedStatus
                        ${dateCondition.replace(/ci\./g, 'ci2.')}
                    )
                    AND ci1.call_status = :notContactedStatus
                    ${dateCondition.replace(/ci\./g, 'ci1.')}
                    GROUP BY ci1.officer_id, ui.userName, ui.fullName`,
                    {
                        replacements: { 
                            contactedStatus: 'Contacted',
                            notContactedStatus: 'Not contacted',
                            ...(startDate && endDate && { startDate, endDate })
                        },
                        type: QueryTypes.SELECT
                    }
                ),

                // sequelize.query(`
                //     SELECT 
                //         al.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                //         SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                //         SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                //         SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user
                //     FROM assigned_loans al
                //     LEFT JOIN user_informations ui ON al.officer_id = ui.userId
                //     LEFT JOIN actual_collection_data acd ON al.loan_id = acd.loan_id
                //     LEFT JOIN due_loan_datas dld ON acd.loan_id = dld.loan_id
                //     where 1=1
                //         ${productTypeCondition}
                //         ${collectiondateCondition}
                //     GROUP BY al.officer_id, ui.userName, ui.fullName
                //     ORDER BY al.officer_id`,
                //     {
                //         replacements: { 
                //             ...(startDate && endDate && { startDate, endDate }),
                //             ...(productType && { productType })
                //         },
                //         type: QueryTypes.SELECT
                //     }
                // ), 
               
                // sequelize.query(`
                //     SELECT 
                //         al.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                //         SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                //         SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                //         SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user
                //     FROM assigned_loans al
                //     LEFT JOIN user_informations ui ON al.officer_id = ui.userId
                //     LEFT JOIN actual_collection_data acd ON al.loan_id = acd.loan_id
                //     LEFT JOIN due_loan_datas dld ON acd.loan_id = dld.loan_id
                //     WHERE 1=1
                //         ${productTypeCondition}
                //         ${collectiondateCondition}
                //     GROUP BY al.officer_id, ui.userName, ui.fullName
                //     ORDER BY total_collected_per_user ASC`,
                //     {
                //         replacements: { 
                //             ...(startDate && endDate && { startDate, endDate }),
                //             ...(productType && { productType })
                //         },
                //         type: QueryTypes.SELECT
                //     }
                // ),


                
                sequelize.query(`
                    SELECT 
                        al.officer_id,
                        ui.userName,
                        ui.fullName,
                        ao.team,
                        SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                        SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                        SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                        SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user,
                        COUNT(DISTINCT acd.loan_id) as total_loans_collected
                    FROM assigned_loans al
                        USE INDEX (idx_officer_id)
                    INNER JOIN user_informations ui 
                        USE INDEX (PRIMARY)
                        ON al.officer_id = ui.userId
                    INNER JOIN active_officers ao 
                        USE INDEX (idx_officer_team)
                        ON al.officer_id = ao.officerId
                    LEFT JOIN actual_collection_data acd 
                        USE INDEX (idx_loan_collection_date)
                        ON al.loan_id = acd.loan_id
                    LEFT JOIN due_loan_datas dld 
                        USE INDEX (PRIMARY)
                        ON acd.loan_id = dld.loan_id
                    WHERE 1=1
                        ${productTypeCondition}
                        ${collectiondateCondition}
                        AND ((ao.team != 'recovery' AND
                            ((dld.npl_assignment_status = 'ASSIGNED' AND acd.collection_date < dld.updatedAt) OR 
                            dld.npl_assignment_status = 'UNASSIGNED'))
                        OR (ao.team = 'recovery' AND acd.collection_date > dld.updatedAt))
                    GROUP BY 
                        al.officer_id, 
                        ui.userName, 
                        ui.fullName
                    ORDER BY 
                        total_collected_per_user ASC
                `, {
                    replacements: { 
                        ...(startDate && endDate && { startDate, endDate }),
                        ...(productType && { productType })
                    },
                    type: QueryTypes.SELECT
                }),

            ]);
        
            return statistics;
        };
        
        // Process the results
        const [basicStats, neverContacted, neverContactedWithStatus, collectionSummary] = await getOfficerStatistics(parsedStartDate, parsedEndDate,parsedProductType);
        
        // const finalStats = basicStats.map(officer => ({
        //     officer_id: officer.officer_id,
        //     userName: officer.userName,
        //     fullName: officer.fullName,
        //     statistics: {
        //         totalContactedCount: parseInt(officer.total_contacted) || 0,
        //         totalNotContactedCount: parseInt(officer.total_not_contacted) || 0,
        //         uniqueContactedLoansCount: parseInt(officer.unique_contacted_loans) || 0,
        //         uniqueNotContactedLoansCount: parseInt(officer.unique_not_contacted_loans) || 0,
        //         totalUniqueLoans: parseInt(officer.total_unique_loans) || 0,
        //         neverContactedLoansCount: parseInt(neverContacted.find(nc => nc.officer_id === officer.officer_id)?.count || 0),
        //         neverContactedWithStatusCount: parseInt(neverContactedWithStatus.find(nc => nc.officer_id === officer.officer_id)?.count || 0)
        //     },
        //     collection_summary: collectionSummary.find(cs => cs.officer_id === officer.officer_id) || {
        //         total_collected_per_user: 0,
        //         total_penalty_collected_per_user: 0,
        //         total_principal_collected_per_user: 0,
        //         total_interest_collected_per_user: 0
        //     }
        // }))  
        
        


        const finalStats = collectionSummary.map(officer => ({
            officer_id: officer.officer_id,
            userName: officer.userName,
            fullName: officer.fullName,
            statistics: {
                totalContactedCount: parseInt(basicStats.find(nc => nc.officer_id === officer.officer_id)?.total_contacted || 0),
                totalNotContactedCount: parseInt(basicStats.find(nc => nc.officer_id === officer.officer_id)?.total_not_contacted || 0),
                uniqueContactedLoansCount: parseInt(basicStats.find(nc => nc.officer_id === officer.officer_id)?.unique_contacted_loans|| 0),
                uniqueNotContactedLoansCount: parseInt(basicStats.find(nc => nc.officer_id === officer.officer_id)?.unique_not_contacted_loans|| 0),
                totalUniqueLoans: parseInt(basicStats.find(nc => nc.officer_id === officer.officer_id)?.total_unique_loans|| 0),
                neverContactedLoansCount: parseInt(neverContacted.find(nc => nc.officer_id === officer.officer_id)?.count || 0),
                neverContactedWithStatusCount: parseInt(neverContactedWithStatus.find(nc => nc.officer_id === officer.officer_id)?.count || 0)
            },
            collection_summary:{
                total_collected_per_user: parseInt(officer.total_collected_per_user)  || 0,
                total_penalty_collected_per_user:  parseInt(officer.total_penalty_collected_per_user) || 0,
                total_principal_collected_per_user:  parseInt(officer.total_principal_collected_per_user) || 0,
                total_interest_collected_per_user:  parseInt(officer.total_interest_collected_per_user) || 0
            }
        })) 

        return res.status(200).json({data:{
            summaryStats,
            weeklyStats,
            monthlyStats,
            generalStats,
            statistics: finalStats
        }
        });
    } catch (error) {
        console.error('Error fetching collection statistics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        // throw error;
    }
}


async function getCollectionStatisticsPerUser(req, res) {
    try {
        const { startDate, endDate, productType } = req.body;

        // function getDateRange(startDate, endDate) {
        //     const start = new Date(startDate);
        //     const end = new Date(endDate);
        //     start.setHours(0, 0, 0, 0);
        //     end.setHours(23, 59, 59, 999);
        //     return { 
        //         startDate: start.toISOString(), 
        //         endDate: end.toISOString() 
        //     };
        // }

        // const parsedProductType = productType || null;
        // const dateRange = startDate ? getDateRange(startDate, endDate) : null;
        // const parsedStartDate = dateRange?.startDate || null;
        // const parsedEndDate = dateRange?.endDate || null;



                
        function getDateRange(startDate, endDate) {
            // Method 2: Using toLocaleDateString
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return {
                startDate: start.toLocaleDateString('en-CA'), // 'en-CA' gives "YYYY-MM-DD" format
                endDate: end.toLocaleDateString('en-CA')
            };
        }

        const dateRange = startDate ? getDateRange(startDate, endDate) : null;
        const parsedStartDate = dateRange?.startDate || null;
        const parsedEndDate = dateRange?.endDate || null;
        const parsedProductType = productType || null;
    
        console.log("===========----=====-", dateRange)

        const getOfficerStatistics = async (startDate = null, endDate = null, productType = null) => {

            const dateCondition = startDate && endDate 
                ? 'AND ci.date BETWEEN :startDate AND :endDate' 
                : '';

            // const collectiondateCondition = startDate && endDate 
            //     ? 'AND acd.collection_date BETWEEN :startDate AND :endDate AND dld.collection_date BETWEEN :startDate AND :endDate ' 
            //     : '';

            const collectiondateCondition = startDate && endDate 
            ? 'AND acd.collection_date BETWEEN :startDate AND :endDate' 
            : '';

            
            const productTypeCondition = productType 
                ? `AND dld.product_type = :productType`
                : '';

            // const dldDateCondition = startDate && endDate 
            //     ? 'AND dld.uploaded_date BETWEEN :startDate AND :endDate' 
            //     : '';

            const dldDateCondition = startDate && endDate 
                ? 'AND dld.uploaded_date BETWEEN DATE_SUB(:startDate, INTERVAL 1 DAY) AND DATE_SUB(:endDate, INTERVAL 1 DAY)' 
                : '';

            const assign_collectiondateCondition = startDate && endDate 
            ? 'AND al.assigned_date BETWEEN :startDate AND :endDate' 
            : '';
            const statistics = await Promise.all([
                // Call statistics
                sequelize.query(`
                    SELECT 
                        ci.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(CASE WHEN ci.call_status = 'Contacted' THEN 1 END) as total_contacted,
                        COUNT(CASE WHEN ci.call_status = 'Not contacted' THEN 1 END) as total_not_contacted,
                        COUNT(DISTINCT CASE WHEN ci.call_status = 'Contacted' THEN ci.loan_id END) as unique_contacted_loans,
                        COUNT(DISTINCT CASE WHEN ci.call_status = 'Not contacted' THEN ci.loan_id END) as unique_not_contacted_loans,
                        COUNT(DISTINCT ci.loan_id) as total_unique_loans
                    FROM customer_interactions ci
                    JOIN user_informations ui ON ci.officer_id = ui.userId
                    LEFT JOIN due_loan_datas dld 
                        ON ci.loan_id = dld.loan_id
                    WHERE 1=1 
                    ${productTypeCondition}
                    ${dateCondition}
                    GROUP BY ci.officer_id, ui.userName, ui.fullName
                `, {
                    replacements: {
                        ...(startDate && endDate && { startDate, endDate }),
                        ...(productType && { productType })
                    },
                    type: QueryTypes.SELECT
                }),
            
                // Never contacted loans
                sequelize.query(`
                    SELECT 
                        ci1.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(DISTINCT ci1.loan_id) as count
                    FROM customer_interactions ci1
                    JOIN user_informations ui ON ci1.officer_id = ui.userId
                    LEFT JOIN due_loan_datas dld ON ci1.loan_id = dld.loan_id
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM customer_interactions ci2
                        WHERE ci2.loan_id = ci1.loan_id 
                        AND ci2.call_status = :contactedStatus
                        ${dateCondition.replace(/ci\./g, 'ci2.')}
                    )
                    ${productTypeCondition}
                    ${dateCondition.replace(/ci\./g, 'ci1.')}
                    GROUP BY ci1.officer_id, ui.userName, ui.fullName`,
                    {
                        replacements: { 
                            contactedStatus: 'Contacted',
                            ...(startDate && endDate && { startDate, endDate }),
                            ...(productType && { productType })
                        },
                        type: QueryTypes.SELECT
                    }
                ),

                // Collection statistics
                // sequelize.query(`
                //     SELECT 
                //         al.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                //         SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                //         SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                //         SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user
                //     FROM assigned_loans al
                //     LEFT JOIN user_informations ui ON al.officer_id = ui.userId
                //     LEFT JOIN actual_collection_data acd ON al.loan_id = acd.loan_id
                //     LEFT JOIN due_loan_datas dld ON acd.loan_id = dld.loan_id
                //     WHERE 1=1
                //         ${productTypeCondition}
                //         ${collectiondateCondition}
                //     GROUP BY al.officer_id, ui.userName, ui.fullName
                //     ORDER BY total_collected_per_user DESC`,
                //     {
                //         replacements: { 
                //             ...(startDate && endDate && { startDate, endDate }),
                //             ...(productType && { productType })
                //         },
                //         type: QueryTypes.SELECT
                //     }
                // ),



                // sequelize.query(`
                //     SELECT 
                //         al.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         ao.team,
                //         SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                //         SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                //         SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                //         SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user,
                //         COUNT(DISTINCT acd.loan_id) as total_loans_collected
                //     FROM assigned_loans al
                //         USE INDEX (idx_officer_id)
                //     INNER JOIN user_informations ui 
                //         USE INDEX (PRIMARY)
                //         ON al.officer_id = ui.userId
                //     INNER JOIN active_officers ao 
                //         USE INDEX (idx_officer_team)
                //         ON al.officer_id = ao.officerId
                //     LEFT JOIN actual_collection_data acd 
                //         USE INDEX (idx_loan_collection_date)
                //         ON al.loan_id = acd.loan_id
                //     LEFT JOIN due_loan_datas dld 
                //         USE INDEX (PRIMARY)
                //         ON acd.loan_id = dld.loan_id
                //     WHERE 1=1
                //         ${productTypeCondition}
                //         ${collectiondateCondition}
                //         AND (
                //         (ao.team != 'recovery' AND
                //          (
                //             (dld.npl_assignment_status = 'ASSIGNED' AND acd.collection_date < dld.updatedAt) OR 
                //                     dld.npl_assignment_status = 'UNASSIGNED'
                //          )
                //         OR 
                //             (ao.team = 'recovery' AND acd.collection_date > dld.updatedAt)
                //         )
                        
                //     GROUP BY 
                //         al.officer_id, 
                //         ui.userName, 
                //         ui.fullName
                //     ORDER BY 
                //         total_collected_per_user DESC
                // `, {
                //     replacements: { 
                //         ...(startDate && endDate && { startDate, endDate }),
                //         ...(productType && { productType })
                //     },
                //     type: QueryTypes.SELECT
                // }),
                 



                sequelize.query(`
                    SELECT 
                        al.officer_id,
                        ui.userName,
                        ui.fullName,
                        ao.team,
                        SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                        SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                        SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                        SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user,
                        COUNT(DISTINCT acd.loan_id) as total_loans_collected
                    FROM assigned_loans al
                        USE INDEX (idx_officer_id)
                    INNER JOIN user_informations ui 
                        USE INDEX (PRIMARY)
                        ON al.officer_id = ui.userId
                    INNER JOIN active_officers ao 
                        USE INDEX (idx_officer_team)
                        ON al.officer_id = ao.officerId
                    LEFT JOIN actual_collection_data acd 
                        USE INDEX (idx_loan_collection_date)
                        ON al.loan_id = acd.loan_id
                    LEFT JOIN due_loan_datas dld 
                        USE INDEX (PRIMARY)
                        ON acd.loan_id = dld.loan_id
                    WHERE 1=1
                        ${productTypeCondition}
                        ${assign_collectiondateCondition}
                        AND ((ao.team != 'recovery' AND
                            ((dld.npl_assignment_status = 'ASSIGNED' AND acd.collection_date < dld.updatedAt) OR 
                            dld.npl_assignment_status = 'UNASSIGNED'))
                        OR (ao.team = 'recovery' AND acd.collection_date > dld.updatedAt))
                    GROUP BY 
                        al.officer_id, 
                        ui.userName, 
                        ui.fullName
                    ORDER BY 
                        total_collected_per_user DESC
                `, {
                    replacements: { 
                        ...(startDate && endDate && { startDate, endDate }),
                        ...(productType && { productType })
                    },
                    type: QueryTypes.SELECT
                }),
                

                // Assigned customers and due amounts
                sequelize.query(`
                    SELECT 
                        al.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(DISTINCT al.loan_id) AS total_assigned_customer,
                        SUM(COALESCE(dld.outstanding_balance, 0)) AS total_due_amount
                    FROM assigned_loans al
                    LEFT JOIN user_informations ui ON al.officer_id = ui.userId
                    LEFT JOIN due_loan_datas dld ON al.loan_id = dld.loan_id
                    WHERE 1=1
                        ${productTypeCondition}
                        ${assign_collectiondateCondition}
                    GROUP BY al.officer_id, ui.userName, ui.fullName
                    `,
                    {
                        replacements: { 
                            ...(productType && { productType }),
                            ...(startDate && endDate && { startDate, endDate }),
                        },
                        type: QueryTypes.SELECT
                    }
                ),
            ]);
            
            return statistics;
        };
        
        const [basicStats, neverContacted, collectionSummary, assigned_customer] = 
            await getOfficerStatistics(parsedStartDate, parsedEndDate, parsedProductType);
        
        const finalStats = basicStats.map(officer => ({
            officer_id: officer.officer_id,
            userName: officer.userName,
            fullName: officer.fullName,
            statistics: {
                totalContactedCount: parseInt(officer.total_contacted) || 0,
                totalNotContactedCount: parseInt(officer.total_not_contacted) || 0,
                uniqueContactedLoansCount: parseInt(officer.unique_contacted_loans) || 0,
                uniqueNotContactedLoansCount: parseInt(officer.unique_not_contacted_loans) || 0,
                totalUniqueLoans: parseInt(officer.total_unique_loans) || 0,
                neverContactedLoansCount: parseInt(neverContacted.find(nc => nc.officer_id === officer.officer_id)?.count || 0)
            },
            collection_summary: collectionSummary.find(cs => cs.officer_id === officer.officer_id) || {
                total_collected_per_user: 0,
                total_penalty_collected_per_user: 0,
                total_principal_collected_per_user: 0,
                total_interest_collected_per_user: 0
            },
            assigned_customer: assigned_customer.find(cs => cs.officer_id === officer.officer_id) || {
                total_assigned_customer: 0,
                total_due_amount: 0
            }
        }));

        return res.status(200).json({
            data: {
                statistics: finalStats
            }
        });
    } catch (error) {
        console.error('Error fetching collection statistics:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}




async function getRecoveryCollectionStatisticsPerUser(req, res) {
    try {
        const { startDate, endDate, productType } = req.body;

        // function getDateRange(startDate, endDate) {
        //     const start = new Date(startDate);
        //     const end = new Date(endDate);
        //     start.setHours(0, 0, 0, 0);
        //     end.setHours(23, 59, 59, 999);
        //     return { 
        //         startDate: start.toISOString(), 
        //         endDate: end.toISOString() 
        //     };
        // }

        // const parsedProductType = productType || null;
        // const dateRange = startDate ? getDateRange(startDate, endDate) : null;
        // const parsedStartDate = dateRange?.startDate || null;
        // const parsedEndDate = dateRange?.endDate || null;



                
        function getDateRange(startDate, endDate) {
            // Method 2: Using toLocaleDateString
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return {
                startDate: start.toLocaleDateString('en-CA'), // 'en-CA' gives "YYYY-MM-DD" format
                endDate: end.toLocaleDateString('en-CA')
            };
        }

        const dateRange = startDate ? getDateRange(startDate, endDate) : null;
        const parsedStartDate = dateRange?.startDate || null;
        const parsedEndDate = dateRange?.endDate || null;
        const parsedProductType = productType || null;


        const getOfficerStatistics = async (startDate = null, endDate = null, productType = null) => {

            const dateCondition = startDate && endDate 
                ? 'AND ci.date BETWEEN :startDate AND :endDate' 
                : '';

            // const collectiondateCondition = startDate && endDate 
            //     ? 'AND acd.collection_date BETWEEN :startDate AND :endDate AND dld.collection_date BETWEEN :startDate AND :endDate ' 
            //     : '';

            const collectiondateCondition = startDate && endDate 
            ? 'AND acd.collection_date BETWEEN :startDate AND :endDate' 
            : '';

            
            const productTypeCondition = productType 
                ? `AND dld.product_type = :productType`
                : '';

            // const dldDateCondition = startDate && endDate 
            //     ? 'AND dld.uploaded_date BETWEEN :startDate AND :endDate' 
            //     : '';

            const dldDateCondition = startDate && endDate 
                ? 'AND dld.uploaded_date BETWEEN DATE_SUB(:startDate, INTERVAL 1 DAY) AND DATE_SUB(:endDate, INTERVAL 1 DAY)' 
                : '';

            const assign_collectiondateCondition = startDate && endDate 
            ? 'AND al.assigned_date BETWEEN :startDate AND :endDate' 
            : '';
            const statistics = await Promise.all([
                // Call statistics
                sequelize.query(`
                    SELECT 
                        ci.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(CASE WHEN ci.call_status = 'Contacted' THEN 1 END) as total_contacted,
                        COUNT(CASE WHEN ci.call_status = 'Not contacted' THEN 1 END) as total_not_contacted,
                        COUNT(DISTINCT CASE WHEN ci.call_status = 'Contacted' THEN ci.loan_id END) as unique_contacted_loans,
                        COUNT(DISTINCT CASE WHEN ci.call_status = 'Not contacted' THEN ci.loan_id END) as unique_not_contacted_loans,
                        COUNT(DISTINCT ci.loan_id) as total_unique_loans
                    FROM customer_interactions ci
                    JOIN user_informations ui ON ci.officer_id = ui.userId
                    LEFT JOIN due_loan_datas dld 
                        ON ci.loan_id = dld.loan_id
                    WHERE 1=1 
                        ${productTypeCondition}
                        ${dateCondition}
                        AND ci.officer_id IN (SELECT officerId FROM active_officers WHERE team = 'recovery')
                    GROUP BY ci.officer_id, ui.userName, ui.fullName
                `, {
                    replacements: {
                        ...(startDate && endDate && { startDate, endDate }),
                        ...(productType && { productType })
                    },
                    type: QueryTypes.SELECT
                }),
            
                // Never contacted loans
                sequelize.query(`
                    SELECT 
                        ci1.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(DISTINCT ci1.loan_id) as count
                    FROM customer_interactions ci1
                    JOIN user_informations ui ON ci1.officer_id = ui.userId
                    LEFT JOIN due_loan_datas dld ON ci1.loan_id = dld.loan_id
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM customer_interactions ci2
                        WHERE ci2.loan_id = ci1.loan_id 
                        AND ci2.call_status = :contactedStatus
                        ${dateCondition.replace(/ci\./g, 'ci2.')}
                        )
                        ${productTypeCondition}
                        ${dateCondition.replace(/ci\./g, 'ci1.')}
                        AND ci1.officer_id IN (
                            SELECT officerId 
                            FROM active_officers 
                            WHERE team = 'recovery'
                            )
                        GROUP BY ci1.officer_id, ui.userName, ui.fullName`,
                    {
                        replacements: { 
                            contactedStatus: 'Contacted',
                            ...(startDate && endDate && { startDate, endDate }),
                            ...(productType && { productType })
                        },
                        type: QueryTypes.SELECT
                    }
                ),

                // Collection statistics
                // sequelize.query(`
                //     SELECT 
                //         al.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                //         SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                //         SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                //         SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user
                //     FROM assigned_loans al
                //     LEFT JOIN user_informations ui ON al.officer_id = ui.userId
                //     LEFT JOIN actual_collection_data acd ON al.loan_id = acd.loan_id
                //     LEFT JOIN due_loan_datas dld ON acd.loan_id = dld.loan_id
                //     WHERE 1=1
                //         ${productTypeCondition}
                //         ${collectiondateCondition}
                //     GROUP BY al.officer_id, ui.userName, ui.fullName
                //     ORDER BY total_collected_per_user DESC`,
                //     {
                //         replacements: { 
                //             ...(startDate && endDate && { startDate, endDate }),
                //             ...(productType && { productType })
                //         },
                //         type: QueryTypes.SELECT
                //     }
                // ),



                // sequelize.query(`
                //     SELECT 
                //         al.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         ao.team,
                //         SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                //         SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                //         SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                //         SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user,
                //         COUNT(DISTINCT acd.loan_id) as total_loans_collected
                //     FROM assigned_loans al
                //         USE INDEX (idx_officer_id)
                //     INNER JOIN user_informations ui 
                //         USE INDEX (PRIMARY)
                //         ON al.officer_id = ui.userId
                //     INNER JOIN active_officers ao 
                //         USE INDEX (idx_officer_team)
                //         ON al.officer_id = ao.officerId
                //     LEFT JOIN actual_collection_data acd 
                //         USE INDEX (idx_loan_collection_date)
                //         ON al.loan_id = acd.loan_id
                //     LEFT JOIN due_loan_datas dld 
                //         USE INDEX (PRIMARY)
                //         ON acd.loan_id = dld.loan_id
                //     WHERE 1=1
                //         ${productTypeCondition}
                //         ${collectiondateCondition}
                //         AND (
                //         (ao.team != 'recovery' AND
                //          (
                //             (dld.npl_assignment_status = 'ASSIGNED' AND acd.collection_date < dld.updatedAt) OR 
                //                     dld.npl_assignment_status = 'UNASSIGNED'
                //          )
                //         OR 
                //             (ao.team = 'recovery' AND acd.collection_date > dld.updatedAt)
                //         )
                        
                //     GROUP BY 
                //         al.officer_id, 
                //         ui.userName, 
                //         ui.fullName
                //     ORDER BY 
                //         total_collected_per_user DESC
                // `, {
                //     replacements: { 
                //         ...(startDate && endDate && { startDate, endDate }),
                //         ...(productType && { productType })
                //     },
                //     type: QueryTypes.SELECT
                // }),
                 



                // sequelize.query(`
                //     SELECT 
                //         al.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         ao.team,
                //         SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                //         SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                //         SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                //         SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user,
                //         COUNT(DISTINCT acd.loan_id) as total_loans_collected
                //     FROM assigned_loans al
                //         USE INDEX (idx_officer_id)
                //     INNER JOIN user_informations ui 
                //         USE INDEX (PRIMARY)
                //         ON al.officer_id = ui.userId
                //     INNER JOIN active_officers ao 
                //         USE INDEX (idx_officer_team)
                //         ON al.officer_id = ao.officerId
                //     LEFT JOIN actual_collection_data acd 
                //         USE INDEX (idx_loan_collection_date)
                //         ON al.loan_id = acd.loan_id
                //     LEFT JOIN due_loan_datas dld 
                //         USE INDEX (PRIMARY)
                //         ON acd.loan_id = dld.loan_id
                //     WHERE 1=1
                //         ${productTypeCondition}
                //         ${assign_collectiondateCondition}
                //         AND ((ao.team != 'recovery' AND
                //             ((dld.npl_assignment_status = 'ASSIGNED' AND acd.collection_date < dld.updatedAt) OR 
                //             dld.npl_assignment_status = 'UNASSIGNED'))
                //         OR (ao.team = 'recovery' AND acd.collection_date > dld.updatedAt))
                //     GROUP BY 
                //         al.officer_id, 
                //         ui.userName, 
                //         ui.fullName
                //     ORDER BY 
                //         total_collected_per_user DESC
                // `, {
                //     replacements: { 
                //         ...(startDate && endDate && { startDate, endDate }),
                //         ...(productType && { productType })
                //     },
                //     type: QueryTypes.SELECT
                // }),


                sequelize.query(`
                    SELECT 
                        al.officer_id,
                        ui.userName,
                        ui.fullName,
                        ao.team,
                        SUM(COALESCE(acd.total_collected, 0)) AS total_collected_per_user,
                        SUM(COALESCE(acd.penalty_collected, 0)) AS total_penalty_collected_per_user,
                        SUM(COALESCE(acd.principal_collected, 0)) AS total_principal_collected_per_user,
                        SUM(COALESCE(acd.interest_collected, 0)) AS total_interest_collected_per_user,
                        COUNT(DISTINCT acd.loan_id) as total_loans_collected
                    FROM active_officers ao 
                        USE INDEX (idx_officer_team)
                    INNER JOIN assigned_loans al
                        USE INDEX (idx_officer_id)
                        ON al.officer_id = ao.officerId
                    INNER JOIN user_informations ui 
                        USE INDEX (PRIMARY)
                        ON al.officer_id = ui.userId
                    INNER JOIN actual_collection_data acd 
                        USE INDEX (idx_loan_collection_date)
                        ON al.loan_id = acd.loan_id
                    INNER JOIN due_loan_datas dld 
                        USE INDEX (PRIMARY)
                        ON acd.loan_id = dld.loan_id
                    WHERE ao.team = 'recovery'
                        ${productTypeCondition}
                        ${assign_collectiondateCondition}
                        AND acd.collection_date > dld.updatedAt
                    GROUP BY 
                        al.officer_id, 
                        ui.userName, 
                        ui.fullName
                    ORDER BY 
                        total_collected_per_user DESC
                `, {
                    replacements: { 
                        ...(startDate && endDate &&{ startDate, endDate }),
                        ...(productType && { productType })
                    },
                    type: QueryTypes.SELECT
                }),
                
                

                // Assigned customers and due amounts
                sequelize.query(`
                    SELECT 
                        al.officer_id,
                        ui.userName,
                        ui.fullName,
                        COUNT(DISTINCT al.loan_id) AS total_assigned_customer,
                        SUM(COALESCE(dld.outstanding_balance, 0)) AS total_due_amount
                    FROM assigned_loans al
                    LEFT JOIN user_informations ui ON al.officer_id = ui.userId
                    LEFT JOIN due_loan_datas dld ON al.loan_id = dld.loan_id
                    WHERE 1=1
                        ${productTypeCondition}
                        ${assign_collectiondateCondition}
                    GROUP BY al.officer_id, ui.userName, ui.fullName
                    `,
                    {
                        replacements: { 
                            ...(productType && { productType }),
                            ...(startDate && endDate && { startDate, endDate }),
                        },
                        type: QueryTypes.SELECT
                    }
                ),
            ]);
            
            return statistics;
        };
        
        const [basicStats, neverContacted, collectionSummary, assigned_customer] = 
            await getOfficerStatistics(parsedStartDate, parsedEndDate, parsedProductType);
        
        const finalStats = basicStats.map(officer => ({
            officer_id: officer.officer_id,
            userName: officer.userName,
            fullName: officer.fullName,
            statistics: {
                totalContactedCount: parseInt(officer.total_contacted) || 0,
                totalNotContactedCount: parseInt(officer.total_not_contacted) || 0,
                uniqueContactedLoansCount: parseInt(officer.unique_contacted_loans) || 0,
                uniqueNotContactedLoansCount: parseInt(officer.unique_not_contacted_loans) || 0,
                totalUniqueLoans: parseInt(officer.total_unique_loans) || 0,
                neverContactedLoansCount: parseInt(neverContacted.find(nc => nc.officer_id === officer.officer_id)?.count || 0)
            },
            collection_summary: collectionSummary.find(cs => cs.officer_id === officer.officer_id) || {
                total_collected_per_user: 0,
                total_penalty_collected_per_user: 0,
                total_principal_collected_per_user: 0,
                total_interest_collected_per_user: 0
            },
            assigned_customer: assigned_customer.find(cs => cs.officer_id === officer.officer_id) || {
                total_assigned_customer: 0,
                total_due_amount: 0
            }
        }));

        return res.status(200).json({
            data: {
                statistics: finalStats
            }
        });
    } catch (error) {
        console.error('Error fetching collection statistics:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getCollectionStatistics,
    getCollectionStatisticsPerUser, 
    getRecoveryCollectionStatisticsPerUser
};
