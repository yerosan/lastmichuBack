// championOfMonthQuery=`
// SELECT 
//     collection_data.userId,
//     SUM(collection_data.payedAmount) AS totalCollectedAmount,
//     user_informations.fullName
// FROM 
//     collection_data
// LEFT JOIN 
//     user_informations ON user_informations.userId = collection_data.userId
// WHERE 
//     date >= '2024-10-01' AND date <= '2024-10-31'
// GROUP BY 
//     collection_data.userId, user_informations.fullName
// ORDER BY 
//     totalCollectedAmount DESC;

const assignedCustomer = require("../models/customerAssinged")

// `
championQuery=`
SELECT 
    collection_data.userId,
    SUM(collection_data.payedAmount) AS totalCollectedAmount,
    user_informations.fullName
FROM 
    collection_data
LEFT JOIN 
    user_informations ON user_informations.userId = collection_data.userId
WHERE 
    date >= :startDate AND date <= :endDate
GROUP BY 
    collection_data.userId, user_informations.fullName
ORDER BY 
    totalCollectedAmount DESC
LIMIT 1;
`

assignedQuery=`
SELECT 
assigned_customers.assignedId,
assigned_customers.registererId,
assigned_customers.userId,
user_informations.fullName,
assigned_customers.totalAssignedCustomer,
assigned_customers.date
FROM assigned_customers
left join user_informations on user_informations.userId=assigned_customers.userId
 WHERE date BETWEEN :startDate AND :endDate;
`

module.exports={championQuery,assignedQuery}