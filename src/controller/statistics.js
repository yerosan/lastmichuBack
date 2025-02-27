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

            return result
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

        const summaryStats = await getSummaryStats(parsedStartDate, parsedEndDate);




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
                )

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
