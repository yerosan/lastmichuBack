

const { QueryTypes, Op} = require('sequelize');

const e = require("express");
const CustomerInteraction = require("../models/customerInteraction");
const ActualCollectionModel=require("../models/actualCollecttion")


const { Sequelize, where } = require("sequelize");
const CollectionModel = require("../models/collectionModel");
const sequelize = require("../db/db"); // Import your Sequelize instance
const { stat } = require("fs");



// async function getCollectionStatistics(req, res) {
//     try {
//         const { startDate, endDate, considerContactedOnly } = req.body;
        
//         const dateCondition = startDate && endDate 
//             ? 'AND ci.date BETWEEN :startDate AND :endDate' 
//             : '';

//         const contactedCondition = considerContactedOnly 
//             ? "AND ci.call_status = 'Contacted'" 
//             : ''; // If true, only contacted customers are considered

//         const summaryStats = await sequelize.query(`
//             WITH ContactedLoans AS (
//                 SELECT DISTINCT ci.loan_id
//                 FROM customer_interactions ci
//                 WHERE 1=1 
//                 ${contactedCondition} 
//                 ${dateCondition}
//             ),
//             ClosedLoans AS (
//                 SELECT DISTINCT acd.loan_id
//                 FROM actual_collection_data acd
//                 WHERE acd.application_status = 'Closed'
//             ),
//             ClosedLoanSummary AS (
//                 SELECT 
//                     SUM(acd.total_collected) AS closed_total_collected,
//                     SUM(acd.penalty_collected) AS closed_penalty_collected,
//                     SUM(acd.principal_collected) AS closed_principal_collected,
//                     SUM(acd.interest_collected) AS closed_interest_collected
//                 FROM actual_collection_data acd
//                 JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
//                 ${considerContactedOnly ? "JOIN ContactedLoans cl2 ON acd.loan_id = cl2.loan_id" : ""}
//             ),
//             ActiveLoanSummary AS (
//                 SELECT 
//                     SUM(acd.total_collected) AS active_total_collected,
//                     SUM(acd.penalty_collected) AS active_penalty_collected,
//                     SUM(acd.principal_collected) AS active_principal_collected,
//                     SUM(acd.interest_collected) AS active_interest_collected
//                 FROM actual_collection_data acd
//                 WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
//                 ${considerContactedOnly ? "AND acd.loan_id IN (SELECT loan_id FROM ContactedLoans)" : ""}
//             ),
//             OverallSummary AS (
//                 SELECT 
//                     SUM(acd.total_collected) AS overall_total_collected,
//                     SUM(acd.penalty_collected) AS overall_penalty_collected,
//                     SUM(acd.principal_collected) AS overall_principal_collected,
//                     SUM(acd.interest_collected) AS overall_interest_collected
//                 FROM actual_collection_data acd
//                 ${considerContactedOnly ? "JOIN ContactedLoans cl3 ON acd.loan_id = cl3.loan_id" : ""}
//             )
//             SELECT 
//                 cs.closed_total_collected,
//                 cs.closed_penalty_collected,
//                 cs.closed_principal_collected,
//                 cs.closed_interest_collected,
//                 asum.active_total_collected,
//                 asum.active_penalty_collected,
//                 asum.active_principal_collected,
//                 asum.active_interest_collected,
//                 os.overall_total_collected,
//                 os.overall_penalty_collected,
//                 os.overall_principal_collected,
//                 os.overall_interest_collected
//             FROM ClosedLoanSummary cs, ActiveLoanSummary asum, OverallSummary os;
//         `, {
//             replacements: { 
//                 startDate, 
//                 endDate
//             },
//             type: QueryTypes.SELECT
//         });

//         return res.status(200).json({
//             success: true,
//             data: summaryStats[0]
//         });

//     } catch (error) {
//         console.error('Error fetching collection statistics:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// }


// module.exports = { getCollectionStatistics };







// async function getCollectionStatistics(req, res) {

//     // ContactedLoans AS (
//     //     -- Get loan_ids that were contacted (if required)
//     //     SELECT DISTINCT ci.loan_id
//     //     FROM customer_interactions ci
//     //     JOIN DueLoans dl ON ci.loan_id = dl.loan_id
//     //     WHERE 1=1 
//     //     ${contactedCondition} 
//     //     ${dateCondition}
//     // ),
//     try {
//         const { startDate, endDate, considerContactedOnly } = req.body;

//         console.log("----------------------Date range -=======---------", req.body)

//         const dateCondition = startDate && endDate 
//             ? 'AND acd.collection_date BETWEEN :startDate AND :endDate' 
//             : '';

//         const contactedCondition = considerContactedOnly 
//             ? "AND ci.call_status = 'Contacted'" 
//             : '';

//         const summaryStats = await sequelize.query(`
//             WITH DueLoans AS (
//                 -- Select only loans that exist in due_loan_datas
//                 SELECT DISTINCT loan_id FROM due_loan_datas
//             ),
//             ClosedLoans AS (
//                 -- Get loans that are marked as "Closed" and exist in due_loan_datas
//                 SELECT DISTINCT acd.loan_id
//                 FROM actual_collection_data acd
//                 JOIN DueLoans dl ON acd.loan_id = dl.loan_id
//                 WHERE acd.application_status = 'Closed'
//             ),
//             ClosedLoanSummary AS (
//                 -- Sum collected amounts for Closed Loans
//                 SELECT 
//                     SUM(acd.total_collected) AS closed_total_collected,
//                     SUM(acd.penalty_collected) AS closed_penalty_collected,
//                     SUM(acd.principal_collected) AS closed_principal_collected,
//                     SUM(acd.interest_collected) AS closed_interest_collected
//                 FROM actual_collection_data acd
//                 JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
//                 WHERE 1=1
//                 ${dateCondition}
//                 -- ${considerContactedOnly ? "JOIN ContactedLoans cl2 ON acd.loan_id = cl2.loan_id" : ""}
//             ),
//             ActiveLoanSummary AS (
//                 -- Sum collected amounts for Active Loans (excluding Closed Loans)
//                 SELECT 
//                     SUM(acd.total_collected) AS active_total_collected,
//                     SUM(acd.penalty_collected) AS active_penalty_collected,
//                     SUM(acd.principal_collected) AS active_principal_collected,
//                     SUM(acd.interest_collected) AS active_interest_collected
//                 FROM actual_collection_data acd
//                 JOIN DueLoans dl ON acd.loan_id = dl.loan_id
//                 WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
//                 ${dateCondition}
//                 -- ${considerContactedOnly ? "AND acd.loan_id IN (SELECT loan_id FROM ContactedLoans)" : ""}
//             ),
//             OverallSummary AS (
//                 -- Sum collected amounts for ALL loans in due_loan_datas
//                 SELECT 
//                     SUM(acd.total_collected) AS overall_total_collected,
//                     SUM(acd.penalty_collected) AS overall_penalty_collected,
//                     SUM(acd.principal_collected) AS overall_principal_collected,
//                     SUM(acd.interest_collected) AS overall_interest_collected
//                 FROM actual_collection_data acd
//                 JOIN DueLoans dl ON acd.loan_id = dl.loan_id
//                 WHERE 1=1
//                 ${dateCondition}
//                 -- ${considerContactedOnly ? "JOIN ContactedLoans cl3 ON acd.loan_id = cl3.loan_id" : ""}
//             )
//             SELECT 
//                 cs.closed_total_collected,
//                 cs.closed_penalty_collected,
//                 cs.closed_principal_collected,
//                 cs.closed_interest_collected,
//                 asum.active_total_collected,
//                 asum.active_penalty_collected,
//                 asum.active_principal_collected,
//                 asum.active_interest_collected,
//                 os.overall_total_collected,
//                 os.overall_penalty_collected,
//                 os.overall_principal_collected,
//                 os.overall_interest_collected
//             FROM ClosedLoanSummary cs, ActiveLoanSummary asum, OverallSummary os;
//         `, {
//             replacements: { 
//                 startDate, 
//                 endDate
//             },
//             type: QueryTypes.SELECT
//         });

//         return res.status(200).json({
//             success: true,
//             data: summaryStats[0]
//         });

//     } catch (error) {
//         console.error('Error fetching collection statistics:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// }




async function getCollectionStatistics(req, res) {
    try {
        const { startDate, endDate } = req.body;
        

        // console.log("----------------------Date range -=======---------", req.body)

        const dateCondition = startDate && endDate 
            ? 'AND acd.collection_date BETWEEN :startDate AND :endDate' 
            : '';

        const summaryStats = await sequelize.query(`
            WITH DueLoans AS (
                -- Select only loans that exist in due_loan_datas
                SELECT DISTINCT loan_id FROM due_loan_datas
            ),
            ClosedLoans AS (
                -- Get loans that are marked as "Closed" and exist in due_loan_datas
                SELECT DISTINCT acd.loan_id
                FROM actual_collection_data acd
                JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                WHERE acd.application_status = 'Closed'
            ),
            ClosedLoanSummary AS (
                -- Sum collected amounts for Closed Loans
                SELECT 
                    COALESCE(SUM(acd.total_collected), 0) AS closed_total_collected,
                    COALESCE(SUM(acd.penalty_collected), 0) AS closed_penalty_collected,
                    COALESCE(SUM(acd.principal_collected), 0) AS closed_principal_collected,
                    COALESCE(SUM(acd.interest_collected), 0) AS closed_interest_collected
                FROM actual_collection_data acd
                JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
                WHERE 1=1
                ${dateCondition}
            ),
            ActiveLoanSummary AS (
                -- Sum collected amounts for Active Loans (excluding Closed Loans)
                SELECT 
                    COALESCE(SUM(acd.total_collected), 0) AS active_total_collected,
                    COALESCE(SUM(acd.penalty_collected), 0) AS active_penalty_collected,
                    COALESCE(SUM(acd.principal_collected), 0) AS active_principal_collected,
                    COALESCE(SUM(acd.interest_collected), 0) AS active_interest_collected
                FROM actual_collection_data acd
                JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
                ${dateCondition}
            ),
            OverallSummary AS (
                -- Sum collected amounts for ALL loans in due_loan_datas
                SELECT 
                    COALESCE(SUM(acd.total_collected), 0) AS overall_total_collected,
                    COALESCE(SUM(acd.penalty_collected), 0) AS overall_penalty_collected,
                    COALESCE(SUM(acd.principal_collected), 0) AS overall_principal_collected,
                    COALESCE(SUM(acd.interest_collected), 0) AS overall_interest_collected
                FROM actual_collection_data acd
                JOIN DueLoans dl ON acd.loan_id = dl.loan_id
                WHERE 1=1
                ${dateCondition}
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
                os.overall_interest_collected
            FROM ClosedLoanSummary cs
            CROSS JOIN ActiveLoanSummary asum
            CROSS JOIN OverallSummary os`,
            {
                replacements: { 
                    ...(startDate && endDate && { startDate, endDate })
                },
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
            overall_interest_collected: 0
        };

        const result = summaryStats.length > 0 ? summaryStats[0] : defaultStats;

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error getting collection statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get collection statistics',
            error: error.message
        });
    }
}










// async function getCollectionStatistics(req, res) {
//     try {
//         const summaryStats = await sequelize.query(`
//             WITH MaxDateInfo AS (
//                 -- Get the maximum collection date from actual_collection_data
//                 SELECT 
//                     MAX(acd.collection_date) AS max_date,
//                     DATE(MAX(acd.collection_date)) AS max_date_only
//                 FROM actual_collection_data acd
//             ),
//             DueLoans AS (
//                 -- Select only loans that exist in due_loan_datas
//                 SELECT DISTINCT loan_id FROM due_loan_datas
//             ),
//             ClosedLoans AS (
//                 -- Get loans that are marked as "Closed" and exist in due_loan_datas
//                 -- Only for the max date
//                 SELECT DISTINCT acd.loan_id
//                 FROM actual_collection_data acd
//                 JOIN DueLoans dl ON acd.loan_id = dl.loan_id
//                 JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
//                 WHERE acd.application_status = 'Closed'
//             ),
//             ClosedLoanSummary AS (
//                 -- Sum collected amounts for Closed Loans on the max date
//                 SELECT 
//                     COALESCE(SUM(acd.total_collected), 0) AS closed_total_collected,
//                     COALESCE(SUM(acd.penalty_collected), 0) AS closed_penalty_collected,
//                     COALESCE(SUM(acd.principal_collected), 0) AS closed_principal_collected,
//                     COALESCE(SUM(acd.interest_collected), 0) AS closed_interest_collected
//                 FROM actual_collection_data acd
//                 JOIN ClosedLoans cl ON acd.loan_id = cl.loan_id
//                 JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
//             ),
//             ActiveLoanSummary AS (
//                 -- Sum collected amounts for Active Loans (excluding Closed Loans) on the max date
//                 SELECT 
//                     COALESCE(SUM(acd.total_collected), 0) AS active_total_collected,
//                     COALESCE(SUM(acd.penalty_collected), 0) AS active_penalty_collected,
//                     COALESCE(SUM(acd.principal_collected), 0) AS active_principal_collected,
//                     COALESCE(SUM(acd.interest_collected), 0) AS active_interest_collected
//                 FROM actual_collection_data acd
//                 JOIN DueLoans dl ON acd.loan_id = dl.loan_id
//                 JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
//                 WHERE acd.loan_id NOT IN (SELECT loan_id FROM ClosedLoans)
//             ),
//             OverallSummary AS (
//                 -- Sum collected amounts for ALL loans in due_loan_datas on the max date
//                 SELECT 
//                     COALESCE(SUM(acd.total_collected), 0) AS overall_total_collected,
//                     COALESCE(SUM(acd.penalty_collected), 0) AS overall_penalty_collected,
//                     COALESCE(SUM(acd.principal_collected), 0) AS overall_principal_collected,
//                     COALESCE(SUM(acd.interest_collected), 0) AS overall_interest_collected
//                 FROM actual_collection_data acd
//                 JOIN DueLoans dl ON acd.loan_id = dl.loan_id
//                 JOIN MaxDateInfo mdi ON DATE(acd.collection_date) = mdi.max_date_only
//             )
//             SELECT 
//                 cs.closed_total_collected,
//                 cs.closed_penalty_collected,
//                 cs.closed_principal_collected,
//                 cs.closed_interest_collected,
//                 asum.active_total_collected,
//                 asum.active_penalty_collected,
//                 asum.active_principal_collected,
//                 asum.active_interest_collected,
//                 os.overall_total_collected,
//                 os.overall_penalty_collected,
//                 os.overall_principal_collected,
//                 os.overall_interest_collected,
//                 (SELECT max_date_only FROM MaxDateInfo) AS collection_date
//             FROM ClosedLoanSummary cs
//             CROSS JOIN ActiveLoanSummary asum
//             CROSS JOIN OverallSummary os`,
//             {
//                 type: QueryTypes.SELECT
//             }
//         );

//         // If no results, return zeros for all fields
//         const defaultStats = {
//             closed_total_collected: 0,
//             closed_penalty_collected: 0,
//             closed_principal_collected: 0,
//             closed_interest_collected: 0,
//             active_total_collected: 0,
//             active_penalty_collected: 0,
//             active_principal_collected: 0,
//             active_interest_collected: 0,
//             overall_total_collected: 0,
//             overall_penalty_collected: 0,
//             overall_principal_collected: 0,
//             overall_interest_collected: 0,
//             collection_date: null
//         };

//         const result = summaryStats.length > 0 ? summaryStats[0] : defaultStats;

//         return res.status(200).json({
//             success: true,
//             data: result
//         });

//     } catch (error) {
//         console.error('Error getting collection statistics:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to get collection statistics',
//             error: error.message
//         });
//     }
// }


module.exports = { getCollectionStatistics };