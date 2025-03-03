const { QueryTypes, Op} = require('sequelize');

const e = require("express");
const CustomerInteraction = require("../models/customerInteraction");
const ActualCollectionModel=require("../models/actualCollecttion")


const { Sequelize, where } = require("sequelize");
const CollectionModel = require("../models/collectionModel");
const sequelize = require("../db/db"); // Import your Sequelize instance
const { stat } = require("fs");



async function getCollectionStatistics(req, res) {
    try {

        const getSummaryStats = async (startDate = null, endDate = null) => {
            // Build the date range condition
            const dateCondition = startDate && endDate 
                ? 'AND ci.date BETWEEN :startDate AND :endDate' 
                : '';

            const collectiondateCondition = startDate && endDate 
                ? 'AND acd.collection_date BETWEEN :startDate AND :endDate' 
                : '';

            // const summaryStats = await sequelize.query(`
            //     SELECT 
            //         -- Collection Summary
            //         collection_summary.total_collected,
            //         collection_summary.total_penalty_collected,
            //         collection_summary.total_principal_collected,
            //         collection_summary.total_interest_collected,
                    
            //         -- Call Status Counts
            //         call_stats.total_contacted,
            //         call_stats.total_not_contacted,
            //         call_stats.unique_contacted_loans,
            //         call_stats.unique_not_contacted_loans,
            //         call_stats.total_unique_loans,
            //         never_contacted.never_contacted_count,
            //         never_contacted_status.never_contacted_status_count
            //     FROM (
            //         -- Collection Summary Subquery
            //         SELECT 
            //             SUM(total_collected) AS total_collected,
            //             SUM(penalty_collected) AS total_penalty_collected,
            //             SUM(principal_collected) AS total_principal_collected,
            //             SUM(interest_collected) AS total_interest_collected
            //         FROM (
            //             SELECT 
            //                 ci.loan_id,
            //                 SUM(acd.total_collected) AS total_collected,
            //                 SUM(acd.penalty_collected) AS penalty_collected,
            //                 SUM(acd.principal_collected) AS principal_collected,
            //                 SUM(acd.interest_collected) AS interest_collected
            //             FROM customer_interactions ci
            //             JOIN actual_collection_data acd ON ci.loan_id = acd.loan_id
            //             INNER JOIN due_loan_datas al ON acd.loan_id = al.loan_id
            //             WHERE 1=1
            //             ${collectiondateCondition}
            //             GROUP BY ci.loan_id
            //         ) AS loan_summary
                    

            //     ) AS collection_summary
            //     CROSS JOIN (
            //         -- Call Status Statistics
            //         SELECT 
            //             COUNT(CASE WHEN call_status = 'Contacted' THEN 1 END) as total_contacted,
            //             COUNT(CASE WHEN call_status = 'Not contacted' THEN 1 END) as total_not_contacted,
            //             COUNT(DISTINCT CASE WHEN call_status = 'Contacted' THEN loan_id END) as unique_contacted_loans,
            //             COUNT(DISTINCT CASE WHEN call_status = 'Not contacted' THEN loan_id END) as unique_not_contacted_loans,
            //             COUNT(DISTINCT loan_id) as total_unique_loans
            //         FROM customer_interactions ci
            //         WHERE 1=1 ${dateCondition}
            //     ) AS call_stats
            //     CROSS JOIN (
            //         -- Never Contacted Loans Count
            //         SELECT COUNT(DISTINCT ci1.loan_id) as never_contacted_count
            //         FROM customer_interactions ci1
            //         WHERE NOT EXISTS (
            //             SELECT 1 
            //             FROM customer_interactions ci2
            //             WHERE ci2.loan_id = ci1.loan_id 
            //             AND ci2.call_status = :contactedStatus
            //             ${dateCondition.replace(/ci\./g, 'ci2.')}
            //         )
            //         ${dateCondition.replace(/ci\./g, 'ci1.')}
            //     ) AS never_contacted
            //     CROSS JOIN (
            //         -- Never Contacted Loans with Status Count
            //         SELECT COUNT(DISTINCT ci1.loan_id) as never_contacted_status_count
            //         FROM customer_interactions ci1
            //         WHERE NOT EXISTS (
            //             SELECT 1 
            //             FROM customer_interactions ci2
            //             WHERE ci2.loan_id = ci1.loan_id 
            //             AND ci2.call_status = :contactedStatus
            //             ${dateCondition.replace(/ci\./g, 'ci2.')}
            //         )
            //         AND ci1.call_status = :notContactedStatus
            //         ${dateCondition.replace(/ci\./g, 'ci1.')}
            //     ) AS never_contacted_status`,
            //     {
            //         replacements: { 
            //             contactedStatus: 'Contacted',
            //             notContactedStatus: 'Not contacted',
            //             ...(startDate && endDate && { 
            //                 startDate: startDate, 
            //                 endDate: endDate
            //             })
            //         },
            //         type: QueryTypes.SELECT
            //     }
            // );




            // const summaryStats = await sequelize.query(`
            //     WITH MaxCollectionDate AS (
            //         -- Get the maximum collection date from actual_collection_data
            //         SELECT MAX(collection_date) AS max_date
            //         FROM actual_collection_data
            //     ),
            //     YesterdayCollections AS (
            //         -- Get collections from the max date only
            //         SELECT 
            //             loan_id,
            //             total_collected,
            //             penalty_collected,
            //             principal_collected,
            //             interest_collected
            //         FROM actual_collection_data acd
            //         JOIN MaxCollectionDate mcd ON DATE(acd.collection_date) = DATE(mcd.max_date)
            //     )
                
            //     SELECT 
            //         -- Collection Summary
            //         collection_summary.total_collected,
            //         collection_summary.total_penalty_collected,
            //         collection_summary.total_principal_collected,
            //         collection_summary.total_interest_collected,
                    
            //         -- Call Status Counts
            //         call_stats.total_contacted,
            //         call_stats.total_not_contacted,
            //         call_stats.unique_contacted_loans,
            //         call_stats.unique_not_contacted_loans,
            //         call_stats.total_unique_loans,
            //         never_contacted.never_contacted_count,
            //         never_contacted_status.never_contacted_status_count
            //     FROM (
            //         -- Collection Summary Subquery - Only for the max collection date
            //         SELECT 
            //             SUM(total_collected) AS total_collected,
            //             SUM(penalty_collected) AS total_penalty_collected,
            //             SUM(principal_collected) AS total_principal_collected,
            //             SUM(interest_collected) AS total_interest_collected
            //         FROM (
            //             SELECT 
            //                 ci.loan_id,
            //                 SUM(yc.total_collected) AS total_collected,
            //                 SUM(yc.penalty_collected) AS penalty_collected,
            //                 SUM(yc.principal_collected) AS principal_collected,
            //                 SUM(yc.interest_collected) AS interest_collected
            //             FROM customer_interactions ci
            //             JOIN YesterdayCollections yc ON ci.loan_id = yc.loan_id
            //             INNER JOIN due_loan_datas al ON yc.loan_id = al.loan_id
            //             GROUP BY ci.loan_id
            //         ) AS loan_summary
            //     ) AS collection_summary
            //     CROSS JOIN (
            //         -- Call Status Statistics - Using the same max date
            //         SELECT 
            //             COUNT(CASE WHEN call_status = 'Contacted' THEN 1 END) as total_contacted,
            //             COUNT(CASE WHEN call_status = 'Not contacted' THEN 1 END) as total_not_contacted,
            //             COUNT(DISTINCT CASE WHEN call_status = 'Contacted' THEN loan_id END) as unique_contacted_loans,
            //             COUNT(DISTINCT CASE WHEN call_status = 'Not contacted' THEN loan_id END) as unique_not_contacted_loans,
            //             COUNT(DISTINCT loan_id) as total_unique_loans
            //         FROM customer_interactions ci
            //         JOIN MaxCollectionDate mcd ON DATE(ci.date) = DATE(mcd.max_date)
            //     ) AS call_stats
            //     CROSS JOIN (
            //         -- Never Contacted Loans Count - Using the same max date
            //         SELECT COUNT(DISTINCT ci1.loan_id) as never_contacted_count
            //         FROM customer_interactions ci1
            //         JOIN MaxCollectionDate mcd ON DATE(ci1.date) = DATE(mcd.max_date)
            //         WHERE NOT EXISTS (
            //             SELECT 1 
            //             FROM customer_interactions ci2
            //             WHERE ci2.loan_id = ci1.loan_id 
            //             AND ci2.call_status = :contactedStatus
            //             AND DATE(ci2.date) = DATE((SELECT max_date FROM MaxCollectionDate))
            //         )
            //     ) AS never_contacted
            //     CROSS JOIN (
            //         -- Never Contacted Loans with Status Count - Using the same max date
            //         SELECT COUNT(DISTINCT ci1.loan_id) as never_contacted_status_count
            //         FROM customer_interactions ci1
            //         JOIN MaxCollectionDate mcd ON DATE(ci1.date) = DATE(mcd.max_date)
            //         WHERE NOT EXISTS (
            //             SELECT 1 
            //             FROM customer_interactions ci2
            //             WHERE ci2.loan_id = ci1.loan_id 
            //             AND ci2.call_status = :contactedStatus
            //             AND DATE(ci2.date) = DATE((SELECT max_date FROM MaxCollectionDate))
            //         )
            //         AND ci1.call_status = :notContactedStatus
            //     ) AS never_contacted_status`,
            //     {
            //         replacements: { 
            //             contactedStatus: 'Contacted',
            //             notContactedStatus: 'Not contacted'
            //         },
            //         type: QueryTypes.SELECT
            //     }
            // );
            
            


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
                    type: QueryTypes.SELECT
                }
            );





            // const WeeklyStatistics = await sequelize.query(`
            //     WITH DateRange AS (
            //         -- Use provided date range instead of max date
            //         SELECT 
            //             :startDate AS start_date,
            //             :endDate AS end_date
            //     ),
            //     DueLoans AS (
            //         -- Select only loans that exist in due_loan_datas
            //         SELECT DISTINCT loan_id FROM due_loan_datas
            //     ),
            //     ClosedLoans AS (
            //         -- Get loans that are marked as "Closed" and exist in due_loan_datas
            //         -- Within the date range
            //         SELECT DISTINCT acd.loan_id
            //         FROM actual_collection_data acd
            //         JOIN DueLoans dl ON acd.loan_id = dl.loan_id
            //         JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
            //         WHERE acd.application_status = 'Closed'
            //     ),
            //     ClosedLoanSummary AS (
            //         -- Sum collected amounts for Closed Loans within the date range
            //         SELECT 
            //             COALESCE(SUM(acd.total_collected), 0) AS closed_total_collected,
            //             COALESCE(SUM(acd.penalty_collected), 0) AS closed_penalty_collected,
            //             COALESCE(SUM(acd.principal_collected), 0) AS closed_principal_collected,
            //             COALESCE(SUM(acd.interest_collected), 0) AS closed_interest_collected
            //         FROM actual_collection_data acd
            //         JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
            //         JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
            //     ),
            //     ActiveLoanSummary AS (
            //         -- Sum collected amounts for Active Loans (excluding Closed Loans) within the date range
            //         SELECT 
            //             COALESCE(SUM(acd.total_collected), 0) AS active_total_collected,
            //             COALESCE(SUM(acd.penalty_collected), 0) AS active_penalty_collected,
            //             COALESCE(SUM(acd.principal_collected), 0) AS active_principal_collected,
            //             COALESCE(SUM(acd.interest_collected), 0) AS active_interest_collected
            //         FROM actual_collection_data acd
            //         JOIN DueLoans dl ON acd.loan_id = dl.loan_id
            //         JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
            //         WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
            //     ),
            //     OverallSummary AS (
            //         -- Sum collected amounts for ALL loans in due_loan_datas within the date range
            //         SELECT 
            //             COALESCE(SUM(acd.total_collected), 0) AS overall_total_collected,
            //             COALESCE(SUM(acd.penalty_collected), 0) AS overall_penalty_collected,
            //             COALESCE(SUM(acd.principal_collected), 0) AS overall_principal_collected,
            //             COALESCE(SUM(acd.interest_collected), 0) AS overall_interest_collected
            //         FROM actual_collection_data acd
            //         JOIN DueLoans dl ON acd.loan_id = dl.loan_id
            //         JOIN DateRange dr ON DATE(acd.collection_date) BETWEEN dr.start_date AND dr.end_date
            //     )
            //     SELECT 
            //         cs.closed_total_collected,
            //         cs.closed_penalty_collected,
            //         cs.closed_principal_collected,
            //         cs.closed_interest_collected,
            //         asum.active_total_collected,
            //         asum.active_penalty_collected,
            //         asum.active_principal_collected,
            //         asum.active_interest_collected,
            //         os.overall_total_collected,
            //         os.overall_penalty_collected,
            //         os.overall_principal_collected,
            //         os.overall_interest_collected,
            //         :startDate AS start_date,
            //         :endDate AS end_date
            //     FROM ClosedLoanSummary cs
            //     CROSS JOIN ActiveLoanSummary asum
            //     CROSS JOIN OverallSummary os`,
            //     {
            //         replacements: {
            //             startDate: startDate,
            //             endDate: endDate
            //         },
            //         type: QueryTypes.SELECT
            //     }
            // );            






            // Function to get last week's date range (Monday to Sunday)
            function getLastWeekDateRange() {
              // Get current date
              const currentDate = new Date();
              
              // Clone the current date to avoid modifying it
              let date = new Date(currentDate);
              
              // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
              let day = date.getDay();
              
              // Calculate days to subtract to get to last Monday
              // If today is Sunday (0), we need to go back 6 days
              // If today is Monday (1), we need to go back 7 days
              // If today is Tuesday (2), we need to go back 8 days, etc.
              let daysToSubtract = day === 0 ? 6 : day + 6;
              
              // Set date to previous week's Monday
              date.setDate(date.getDate() - daysToSubtract);
              let previousMondayDate = new Date(date);
              
              // Calculate the end of the week (Sunday) by adding 6 days to Monday
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
                    endDate: endDate
                  },
                  type: QueryTypes.SELECT
                }
              );
              
              return WeeklyStatistics;
            }
            
            // For your WeeklyStatistics controller function
            // async function WeeklyStatistics(req, res) {
            //   try {
            //     const weeklyStats = await getWeeklyStatistics();
                
            //     // You can add more information to the response if needed
            //     const response = {
            //       success: true,
            //       data: weeklyStats[0], // Assuming the query returns a single row
            //       message: "Weekly statistics retrieved successfully"
            //     };
                
            //     return res.status(200).json(response);
            //   } catch (error) {
            //     console.error("Error retrieving weekly statistics:", error);
            //     return res.status(500).json({
            //       success: false,
            //       message: "Failed to retrieve weekly statistics",
            //       error: error.message
            //     });
            //   }
            // }
            
            // // Export the controller function
            // module.exports = {
            //   WeeklyStatistics
            // };
            


            // Get general statistics without per-user breakdown
            // const generalStats = await sequelize.query(`
            //     SELECT 
            //         -- Total calls (total table content)
            //         COUNT(*) as total_calls,
                    
            //         -- Call status statistics
            //         COUNT(CASE WHEN call_status = 'Contacted' THEN 1 END) as total_contacted_calls,
            //         COUNT(CASE WHEN call_status = 'Not contacted' THEN 1 END) as total_not_contacted_calls,
                    
            //         -- Unique customers statistics
            //         COUNT(DISTINCT loan_id) as total_unique_customers,
            //         COUNT(DISTINCT CASE WHEN call_status = 'Contacted' THEN loan_id END) as unique_contacted_customers,
            //         COUNT(DISTINCT CASE WHEN call_status = 'Not contacted' THEN loan_id END) as unique_not_contacted_customers,
                    
            //         -- Payment statistics - overall
            //         (SELECT COUNT(DISTINCT ac.loan_id) 
            //         FROM actual_collection_data ac 
            //         WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci ${dateCondition ? 'WHERE ' + dateCondition.substring(8) : ''})) 
            //         as total_customers_paid,
                    
            //         -- Total amount paid - overall
            //         (SELECT SUM(ac.total_collected) 
            //         FROM actual_collection_data ac 
            //         WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci ${dateCondition ? 'WHERE ' + dateCondition.substring(8) : ''})) 
            //         as total_amount_paid,
                    
            //         -- Payment statistics - for contacted customers
            //         (SELECT COUNT(DISTINCT ac.loan_id) 
            //         FROM actual_collection_data ac 
            //         WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci 
            //                             WHERE ci.call_status = 'Contacted' ${dateCondition ? 'AND ' + dateCondition.substring(8) : ''})) 
            //         as contacted_customers_paid,
                    
            //         -- Total amount paid - for contacted customers
            //         (SELECT SUM(ac.total_collected) 
            //         FROM actual_collection_data ac 
            //         WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci 
            //                             WHERE ci.call_status = 'Contacted' ${dateCondition ? 'AND ' + dateCondition.substring(8) : ''})) 
            //         as contacted_amount_paid,
                    
            //         -- Payment statistics - for not contacted customers
            //         (SELECT COUNT(DISTINCT ac.loan_id) 
            //         FROM actual_collection_data ac 
            //         WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci 
            //                             WHERE ci.call_status = 'Not contacted' ${dateCondition ? 'AND ' + dateCondition.substring(8) : ''})) 
            //         as not_contacted_customers_paid,
                    
            //         -- Total amount paid - for not contacted customers
            //         (SELECT SUM(ac.total_collected) 
            //         FROM actual_collection_data ac 
            //         WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci 
            //                             WHERE ci.call_status = 'Not contacted' ${dateCondition ? 'AND ' + dateCondition.substring(8) : ''})) 
            //         as not_contacted_amount_paid
            //     FROM customer_interactions
            //     WHERE 1=1 ${dateCondition}
            // `, {
            //     replacements: {
            //         ...(startDate && endDate && { startDate, endDate })
            //     },
            //     type: QueryTypes.SELECT
            // })






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
                         ${dateCondition ? 'AND ' + dateCondition.substring(8).replace(/ci\./g, 'ci2.') : ''}
                     )
                     ${dateCondition ? 'AND ' + dateCondition.substring(8).replace(/ci\./g, 'ci1.') : ''}
                    ) as unique_not_contacted_customers,
                    
                    -- Payment statistics - overall
                    (SELECT COUNT(DISTINCT ac.loan_id) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci ${dateCondition ? 'WHERE ' + dateCondition.substring(8) : ''})) 
                    as total_customers_paid,
                    
                    -- Total amount paid - overall
                    (SELECT SUM(ac.total_collected) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci ${dateCondition ? 'WHERE ' + dateCondition.substring(8) : ''})) 
                    as total_amount_paid,
                    
                    -- Payment statistics - for contacted customers
                    (SELECT COUNT(DISTINCT ac.loan_id) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci 
                                        WHERE ci.call_status = 'Contacted' ${dateCondition ? 'AND ' + dateCondition.substring(8) : ''})) 
                    as contacted_customers_paid,
                    
                    -- Total amount paid - for contacted customers
                    (SELECT SUM(ac.total_collected) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (SELECT DISTINCT ci.loan_id FROM customer_interactions ci 
                                        WHERE ci.call_status = 'Contacted' ${dateCondition ? 'AND ' + dateCondition.substring(8) : ''})) 
                    as contacted_amount_paid,
                    
                    -- Modified: Payment statistics - for truly not contacted customers (never contacted)
                    (SELECT COUNT(DISTINCT ac.loan_id) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci1.loan_id 
                        FROM customer_interactions ci1
                        WHERE NOT EXISTS (
                            SELECT 1 FROM customer_interactions ci2 
                            WHERE ci2.loan_id = ci1.loan_id 
                            AND ci2.call_status = 'Contacted'
                            ${dateCondition ? 'AND ' + dateCondition.substring(8).replace(/ci\./g, 'ci2.') : ''}
                        )
                        ${dateCondition ? 'AND ' + dateCondition.substring(8).replace(/ci\./g, 'ci1.') : ''}
                    )) 
                    as not_contacted_customers_paid,
                    
                    -- Modified: Total amount paid - for truly not contacted customers (never contacted)
                    (SELECT SUM(ac.total_collected) 
                    FROM actual_collection_data ac 
                    WHERE ac.loan_id IN (
                        SELECT DISTINCT ci1.loan_id 
                        FROM customer_interactions ci1
                        WHERE NOT EXISTS (
                            SELECT 1 FROM customer_interactions ci2 
                            WHERE ci2.loan_id = ci1.loan_id 
                            AND ci2.call_status = 'Contacted'
                            ${dateCondition ? 'AND ' + dateCondition.substring(8).replace(/ci\./g, 'ci2.') : ''}
                        )
                        ${dateCondition ? 'AND ' + dateCondition.substring(8).replace(/ci\./g, 'ci1.') : ''}
                    )) 
                    as not_contacted_amount_paid
                FROM customer_interactions
                WHERE 1=1 ${dateCondition}
            `, {
                replacements: {
                    ...(startDate && endDate && { startDate, endDate })
                },
                type: QueryTypes.SELECT
            });









            // Function to get last month's date range (1st day to last day)
            // function getLastMonthDateRange() {
            //   // Get current date
            //   const currentDate = new Date();
              
            //   // First day of current month
            //   const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              
            //   // Last day of previous month is one day before first day of current month
            //   const lastDayPreviousMonth = new Date(firstDayCurrentMonth);
            //   lastDayPreviousMonth.setDate(lastDayPreviousMonth.getDate() - 1);
              
            //   // First day of previous month
            //   const firstDayPreviousMonth = new Date(lastDayPreviousMonth.getFullYear(), lastDayPreviousMonth.getMonth(), 1);
              
            //   return {
            //     startDate: firstDayPreviousMonth.toISOString().split('T')[0], // Format: YYYY-MM-DD
            //     endDate: lastDayPreviousMonth.toISOString().split('T')[0]     // Format: YYYY-MM-DD
            //   };
            // }
            




            function getLastMonthDateRange() {
                // Get current date
                const currentDate = new Date();
                
                // Get current month and year
                const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
                const currentYear = currentDate.getFullYear();
                
                // Calculate previous month and year
                // If current month is January (0), previous month is December (11) of previous year
                const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                
                // First day of previous month: set to 1st day of the previous month
                const firstDayPreviousMonth = new Date(previousMonthYear, previousMonth, 1);
                
                // Last day of previous month: 
                // Create date for 1st day of current month, then subtract 1 day
                const lastDayPreviousMonth = new Date(currentYear, currentMonth, 0);
                
                // Format dates as YYYY-MM-DD strings
                const startDate = firstDayPreviousMonth.toISOString().split('T')[0];
                const endDate = lastDayPreviousMonth.toISOString().split('T')[0];
                
                // console.log("Current date:", currentDate);
                // console.log("Previous month:", previousMonth + 1); // +1 for human-readable month
                // console.log("Previous month year:", previousMonthYear);
                // console.log("First day of previous month:", firstDayPreviousMonth);
                // console.log("Last day of previous month:", lastDayPreviousMonth);
                // console.log("Date range:", { startDate, endDate });
                
                return { startDate, endDate };
              }
            // Example of using this with your SQL query
            async function getMonthlyStatistics() {
              // Get last month's date range
              const { startDate, endDate } = getLastMonthDateRange();
              
              // Use the date range in your SQL query
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
                    endDate: endDate
                  },
                  type: QueryTypes.SELECT
                }
              );
              
              return summaryStats;
            }
            
            // // For your MonthlyStatistics controller function
            // async function MonthlyStatistics(req, res) {
            //   try {
            //     const monthlyStats = await getMonthlyStatistics();
                
            //     // You can add more information to the response if needed
            //     const response = {
            //       success: true,
            //       data: monthlyStats[0], // Assuming the query returns a single row
            //       message: "Monthly statistics retrieved successfully"
            //     };
                
            //     return res.status(200).json(response);
            //   } catch (error) {
            //     console.error("Error retrieving monthly statistics:", error);
            //     return res.status(500).json({
            //       success: false,
            //       message: "Failed to retrieve monthly statistics",
            //       error: error.message
            //     });
            //   }
            // }
            
            // // Export the controller function
            // module.exports = {
            //   MonthlyStatistics
            // };
            
            



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

        
            // const result = summaryStats[0];
        
            // return {
            //     collection_summary: {
            //         total_collected: result.total_collected || 0,
            //         total_penalty_collected: result.total_penalty_collected || 0,
            //         total_principal_collected: result.total_principal_collected || 0,
            //         total_interest_collected: result.total_interest_collected || 0
            //     },
            //     call_statistics: {
            //         total_contacted: result.total_contacted || 0,
            //         total_not_contacted: result.total_not_contacted || 0,
            //         unique_contacted_loans: result.unique_contacted_loans || 0,
            //         unique_not_contacted_loans: result.unique_not_contacted_loans || 0,
            //         total_unique_loans: result.total_unique_loans || 0,
            //         never_contacted_count: result.never_contacted_count || 0,
            //         never_contacted_status_count: result.never_contacted_status_count || 0
            //     }
            // };

            return {summaryStats:result, generalStats:generalStatsResult,
                weeklyStats:weeklyStats[0], monthlyStats:monthlyStats[0],}
        };
        
        const { startDate, endDate } = req.body;

        
        // Validate dates if provided
        if ((startDate && !endDate) || (!startDate && endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Both startDate and endDate are required for date filtering'
            });
        }

        // function getDateRange(startDate, endDate) {
        //     startDate = `${startDate} 00:00:00`; 
        //     endDate = `${endDate} 23:59:59`;  
        //     return { startDate, endDate };
        // }



        function getDateRange(startDate, endDate) {
            // Parse the dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Set time to beginning of day for start date
            start.setHours(0, 0, 0, 0);
            
            // Set time to end of day for end date
            end.setHours(23, 59, 59, 999);
            
            return { 
                startDate: start.toISOString(), 
                endDate: end.toISOString() 
            };
        }

        const dateRange = startDate ? getDateRange(startDate, endDate) : null;
        const parsedStartDate = dateRange?.startDate || null;
        const parsedEndDate = dateRange?.endDate || null;

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

        const { summaryStats, generalStats,weeklyStats,monthlyStats }= await getSummaryStats(parsedStartDate, parsedEndDate);

        const getOfficerStatistics = async (startDate = null, endDate = null) => {
            // Build the date range condition

            // console.log("-------------Date function-----------", startDate, endDate)
            const dateCondition = startDate && endDate 
                ? 'AND ci.date BETWEEN :startDate AND :endDate' 
                : '';

            const collectiondateCondition = startDate && endDate 
                ? 'AND acd.collection_date BETWEEN :startDate AND :endDate' 
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
                    JOIN user_informations ui ON ci.officer_id = ui.userId
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
                    JOIN user_informations ui ON ci1.officer_id = ui.userId
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
                    JOIN user_informations ui ON ci1.officer_id = ui.userId
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
            
                // Collection summary by officer
                // sequelize.query(`
                //     SELECT 
                //         ci.officer_id,
                //         ui.userName,
                //         ui.fullName,
                //         SUM(acd.total_collected) AS total_collected_per_user,
                //         SUM(acd.penalty_collected) AS total_penalty_collected_per_user,
                //         SUM(acd.principal_collected) AS total_principal_collected_per_user,
                //         SUM(acd.interest_collected) AS total_interest_collected_per_user
                //     FROM customer_interactions ci
                //     JOIN user_informations ui ON ci.officer_id = ui.userId
                //     JOIN actual_collection_data acd ON ci.loan_id = acd.loan_id
                //     WHERE ci.call_status = :contactedStatus
                //     ${dateCondition}
                //     GROUP BY ci.officer_id, ui.userName, ui.fullName`,
                //     {
                //         replacements: { 
                //             contactedStatus: 'Contacted',
                //             ...(startDate && endDate && { startDate, endDate })
                //         },
                //         type: QueryTypes.SELECT
                //     }
                // )







                // Collection summary by officer, only for loan_ids present in due_loan_datas
                sequelize.query(`
                    SELECT 
                        al.officer_id,
                        ui.userName,
                        ui.fullName,
                        SUM(acd.total_collected) AS total_collected_per_user,
                        SUM(acd.penalty_collected) AS total_penalty_collected_per_user,
                        SUM(acd.principal_collected) AS total_principal_collected_per_user,
                        SUM(acd.interest_collected) AS total_interest_collected_per_user
                    FROM assigned_loans al
                    JOIN user_informations ui ON al.officer_id = ui.userId
                    JOIN actual_collection_data acd ON al.loan_id = acd.loan_id
                    INNER JOIN due_loan_datas dld ON acd.loan_id = dld.loan_id  -- Ensures loan_id exists in due_loan_datas
                    -- WHERE 1=1  
                    ${collectiondateCondition}
                    -- WHERE al.call_status = :contactedStatus 
                    GROUP BY al.officer_id, ui.userName, ui.fullName`,
                    {
                        replacements: { 
                            ...(startDate && endDate && { startDate, endDate })
                        },
                        type: QueryTypes.SELECT
                    }
                ),

            ]);
        
            return statistics;
        };
        
        // Process the results
        const [basicStats, neverContacted, neverContactedWithStatus, collectionSummary] = await getOfficerStatistics(parsedStartDate, parsedEndDate);
        
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
                neverContactedLoansCount: parseInt(neverContacted.find(nc => nc.officer_id === officer.officer_id)?.count || 0),
                neverContactedWithStatusCount: parseInt(neverContactedWithStatus.find(nc => nc.officer_id === officer.officer_id)?.count || 0)
            },
            collection_summary: collectionSummary.find(cs => cs.officer_id === officer.officer_id) || {
                total_collected_per_user: 0,
                total_penalty_collected_per_user: 0,
                total_principal_collected_per_user: 0,
                total_interest_collected_per_user: 0
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


module.exports = {
    getCollectionStatistics
};
