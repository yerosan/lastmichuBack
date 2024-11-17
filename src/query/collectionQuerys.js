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
    Collection_data.userId,
    SUM(Collection_data.payedAmount) AS totalCollectedAmount,
    user_informations.fullName
FROM 
    Collection_data
LEFT JOIN 
    user_informations ON user_informations.userId = Collection_data.userId
WHERE 
    date >= :startDate AND date <= :endDate
GROUP BY 
    Collection_data.userId, user_informations.fullName
ORDER BY 
    totalCollectedAmount DESC
LIMIT 1;
`

assignedQuery=`
SELECT 
Assigned_customers.assignedId,
Assigned_customers.registererId,
Assigned_customers.userId,
user_informations.fullName,
Assigned_customers.totalAssignedCustomer,
Assigned_customers.date
FROM Assigned_customers
left join user_informations on user_informations.userId=Assigned_customers.userId
 WHERE date BETWEEN :startDate AND :endDate;
`

module.exports={championQuery,assignedQuery}