const { Model, where } = require("sequelize");
const { Op, Sequelize } = require("sequelize");
const { AssignedLoans, DueLoanData, ActiveOfficers, UserInformations, CustomerInteraction, Payment,DistrictList, BranchList } = require("../models");
const _ = require("lodash");

const assignLoans = async (req, res) => {
    let data = req.body;
    const today = "2025-02-07";

    try {
        let assigned_loans = await AssignedLoans.findOne({
            where: { assigned_date: data.startDate },
        });

        if (assigned_loans) {
            return res.status(200).json({ message: "The given date loans already assigned" });
        }

        // 1. Fetch Active Officers
        const officers = await ActiveOfficers.findAll({
            where: { officerStatus: "active" },
            attributes: ["officerId"],
            raw: true,
        });

        if (!officers.length) {
            return res.status(200).json({ message: "No active officers available." });
        }

        // 2. Fetch Unassigned Due Loans
        const loans = await DueLoanData.findAll({
            where: { uploaded_date: data.startDate },
            attributes: ["loan_id", "phone_number", "product_type"],
            raw: true,
        });

        if (!loans.length) {
            return res.status(200).json({ message: "No loans available for assignment." });
        }

        
        // 3. Shuffle Loans for Fairness
        const shuffledLoans = _.shuffle(loans);
        const shuffledOfficer=_.shuffle(officers)

        // 3. Group Loans by Product Type
        const loansByType = _.groupBy(shuffledLoans, "product_type");
        const assignments = [];
        let officerIndex = 0;
        
        // 4. Distribute loans fairly across officers using a round-robin approach
        let maxLoansPerOfficer = Math.ceil(shuffledLoans.length / shuffledOfficer.length);

        // 5. Iterate through each loan type and distribute fairly
        Object.keys(loansByType).forEach((loanType) => {
            let loanList = loansByType[loanType];

            for (let i = 0; i < loanList.length; i++) {
                const loan = loanList[i];

                // Assign the loan to the current officer
                assignments.push({
                    loan_id: loan.loan_id,
                    officer_id: shuffledOfficer[officerIndex].officerId, 
                    customer_phone: loan.phone_number,
                });

                // Rotate shuffledOfficer ensuring fair distribution
                officerIndex = (officerIndex + 1) % shuffledOfficer.length;
               
            }
        });

        // 6. Batch Insert Assignments into `AssignedLoans`
        await AssignedLoans.bulkCreate(assignments);

        return res.json({ message: "succeed", total_assigned: assignments.length });

    } catch (error) {
        console.error("Error assigning loans:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};




const getAssignedLoans = async (req, res) => {
    try {
        const { date, page = 1, limit = 10 } = req.body;  // Default page = 1, limit = 10

        const offset = (page - 1) * limit;  // Calculate offset

        const { count, rows } = await AssignedLoans.findAndCountAll({
            where: { assigned_date: {[Op.between]:[date.startDate, date.endDate]} },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] }  // Exclude unnecessary fields
                },
                {
                    model: ActiveOfficers,
                    as: "officer",
                    attributes: ["officerId"],
                    required: true,  // Use INNER JOIN for better performance
                    include: [
                        {
                            model: UserInformations,
                            as: "userInfos",
                            attributes: ["userName", "fullName"],  // Fetch only required fields
                            required: true
                        }
                    ]
                }
            ],
            attributes: ["assigned_id", "customer_phone", "assigned_date"],
            limit: parseInt(limit),  // Convert limit to integer
            offset: parseInt(offset),  // Convert offset to integer
            raw: true,  // Return plain objects instead of Sequelize instances
            nest: true  // Ensure proper object nesting
        });

        if(rows.length >0 || count>0){
            res.status(200).json({

                message: "Success",
                totalRecords: count,  // Total number of records
                totalPages: Math.ceil(count / limit),  // Total pages available
                currentPage: page,
                pageSize: limit,
                data: rows
            });
        }else{
            res.status(200).json({message:"Data do not found"})
        }
    } catch (error) {
        console.error("Error fetching assigned loans:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};




// const getUserAssignedLoans = async (req, res) => {
//     try {
//         const { userId, date, page = 1, limit = 10, officer_id, product_type } = req.body;  

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);  

//         const excludedLoanIds = Sequelize.literal(`
//             loan.loan_id NOT IN (
//                 SELECT customer_interactions.loan_id FROM customer_interactions 
//             ) 
//             AND loan.loan_id NOT IN (
//                 SELECT payments.loan_id FROM payments where payment_type="fully paid"
//             )
//         `);

//         const { count, rows } = await AssignedLoans.findAndCountAll({
//             where: {
//                 assigned_date:{[Op.between]:[date.startDate, date.endDate]} ,
//                 officer_id: officer_id,
//                 [Op.and]: [excludedLoanIds]  
//             },
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] }  
//                 },
//                 {
//                     model: ActiveOfficers,
//                     as: "officer",
//                     attributes: ["officerId"],
//                     required: true,  
//                     include: [
//                         {
//                             model: UserInformations,
//                             as: "userInfos",
//                             attributes: ["userName", "fullName"],  
//                             required: true
//                         }
//                     ]
//                 }
//             ],
//             // order: [["createdAt", "DESC"]],
//             attributes: ["assigned_id", "customer_phone", "assigned_date"],
//             limit: parseInt(limit, 10),  
//             offset: parseInt(offset, 10),  
//             raw: true,  
//             nest: true  
//         });

//         if (count > 0) {
//             res.status(200).json({
//                 status: "Success",
//                 message: "Success",
//                 totalRecords: count,  
//                 totalPages: Math.ceil(count / limit),  
//                 currentPage: parseInt(page, 10),
//                 pageSize: parseInt(limit, 10),
//                 data: rows
//             });
//         } else {
//             res.status(200).json({ 
//               status: "Error",
//               message: "No customer left without attempting to connect." 
//             });
//         }

//     } catch (error) {
//         console.error("Error fetching assigned loans:", error);
//         res.status(500).json({
//            status: "Error",
//            message: "Internal server error" });
//     }
// };



// const getUserAssignedLoans = async (req, res) => {
//     try {
//         const { userId, date, page = 1, limit = 10, officer_id, product_type,search } = req.body;  

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);  

//         const excludedLoanIds = Sequelize.literal(`
//             loan.loan_id NOT IN (
//                 SELECT customer_interactions.loan_id FROM customer_interactions 
//             ) 
//             AND loan.loan_id NOT IN (
//                 SELECT payments.loan_id FROM payments WHERE payment_type = "fully paid"
//             )
//         `);

//         const loanFilter = {collection_status:"Active",};  
//         if (product_type) {
//             loanFilter.product_type = product_type;  
//         }


//         const { count, rows } = await AssignedLoans.findAndCountAll({
//             where: {
//                 ...(date.startDate && date.endDate && {assigned_date: { [Op.between]: [date.startDate, date.endDate] }}),
//                 officer_id: officer_id,
//                 [Op.and]: [excludedLoanIds],
//                 ...(search && { customer_phone: { [Op.like]: `%${search}%` } }),  
//             },
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] },  
//                     where: loanFilter ,
//                     include: [
//                         {
//                             model: BranchList,
//                             as: "branch",
//                             attributes: ["branch_code", "branch_name"],
//                             include: [
//                                 {
//                                     model: DistrictList,
//                                     as: "district",
//                                     attributes: ["dis_Id", "district_name"]
//                                 }
//                             ]
//                         }
//                     ]
//                 },
//                 {
//                     model: ActiveOfficers,
//                     as: "officer",
//                     attributes: ["officerId"],
//                     required: true,  
//                     include: [
//                         {
//                             model: UserInformations,
//                             as: "userInfos",
//                             attributes: ["userName", "fullName"],  
//                             required: true
//                         }
//                     ]
//                 }
//             ],
//             attributes: ["assigned_id", "customer_phone", "assigned_date"],
//             order: [
//                 ["assigned_date", "DESC"], // 1st priority: Sort by date (most recent first)
//                 [Sequelize.col("loan.outstanding_balance"), "DESC"] // 2nd priority: If same date, sort by amount
//             ],
//             limit: parseInt(limit, 10),  
//             offset: parseInt(offset, 10),  
//             raw: true,  
//             nest: true  
//         });        

//         if (count > 0) {
//             res.status(200).json({
//                 status: "Success",
//                 message: "Success",
//                 totalRecords: count,  
//                 totalPages: Math.ceil(count / limit),  
//                 currentPage: parseInt(page, 10),
//                 pageSize: parseInt(limit, 10),
//                 data: rows
//             });
//         } else {
//             res.status(200).json({ 
//                 status: "Error",
//                 message: "No customer left without attempting to connect." 
//             });
//         }

//     } catch (error) {
//         console.error("Error fetching assigned loans:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error" 
//         });
//     }
// };







const getUserAssignedLoans = async (req, res) => {
    try {
        const { userId, date, page = 1, limit = 10, officer_id, product_type, search, branch_name, district_name } = req.body;  

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);  

        const team= await ActiveOfficers.findOne({
            where:{officerId:officer_id},
            attributes: ["team"]})
        if (!officer_id) {
            return res.status(200).json({
                status: "Error",
                message: "Officer ID is required."
            });
        }

        const getTeamCondition = (team) => {
            if (team === "follow_up") {
                return {
                    collection_status: "Active",
                    npl_status: "Performing",
                    npl_assignment_status: "UNASSIGNED",
                    ...(product_type && { product_type })
                };
            } else {
                return {
                    collection_status: "Active",
                    ...(product_type && { product_type })
                };
            }
        };

        const excludedLoanIds = Sequelize.literal(`
            loan.loan_id NOT IN (
                SELECT customer_interactions.loan_id FROM customer_interactions 
            ) 
            AND loan.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "fully paid"
            )
        `);

        const loanFilter = { collection_status: "Active" }; 
        // where: getTeamCondition(officerTeam?.team), 
       

        const branchFilter = {};
        if (branch_name) {
            branchFilter.branch_code = branch_name;
        }

        const districtFilter = {};
        if (district_name) {
            districtFilter.dis_Id =  district_name;
        }

        const { count, rows } = await AssignedLoans.findAndCountAll({
            where: {
                ...(date?.startDate && date?.endDate && { assigned_date: { [Op.between]: [date.startDate, date.endDate] } }),
                officer_id: officer_id,
                [Op.and]: [excludedLoanIds],
                ...(search && { customer_phone: { [Op.like]: `%${search}%` } }),  
            },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },  
                    where: getTeamCondition(team?.team),
                    include: [
                        {
                            model: BranchList,
                            as: "branch",
                            attributes: ["branch_code", "branch_name"],
                            where: branchFilter,  // Apply branch name filter
                            include: [
                                {
                                    model: DistrictList,
                                    as: "district",
                                    attributes: ["dis_Id", "district_name"],
                                    where: districtFilter,  // Apply district name filter
                                }
                            ]
                        }
                    ]
                },
                {
                    model: ActiveOfficers,
                    as: "officer",
                    attributes: ["officerId"],
                    required: true,  
                    include: [
                        {
                            model: UserInformations,
                            as: "userInfos",
                            attributes: ["userName", "fullName"],  
                            required: true
                        }
                    ]
                }
            ],
            attributes: ["assigned_id", "customer_phone", "assigned_date"],
            order: [
                ["assigned_date", "DESC"],  
                [Sequelize.col("loan.outstanding_balance"), "DESC"]  
            ],
            limit: parseInt(limit, 10),  
            offset: parseInt(offset, 10),  
            raw: true,  
            nest: true  
        });        

        if (count > 0) {
            res.status(200).json({
                status: "Success",
                message: "Success",
                totalRecords: count,  
                totalPages: Math.ceil(count / limit),  
                currentPage: parseInt(page, 10),
                pageSize: parseInt(limit, 10),
                data: rows
            });
        } else {
            res.status(200).json({ 
                status: "Error",
                message: "No customer left without attempting to connect." 
            });
        }

    } catch (error) {
        console.log("Error fetching assigned loans:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error" 
        });
    }
};

const getUserAssignedLoansHistory = async (req, res) => {
  try {
      const { page = 1, limit = 10, officer_id } = req.body;  

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);  

      const { count, rows } = await AssignedLoans.findAndCountAll({
          where: {
            //   assigned_date: {[Op.between]:[date.startDate,date.endDate]},
              officer_id: officer_id,
              // [Op.and]: [excludedLoanIds]  
          },
          include: [
              {
                  model: DueLoanData,
                  as: "loan",
                  attributes: { exclude: ["createdAt", "updatedAt"] } ,
                  where:{collection_status:"Closed"} 
              },
              {
                  model: ActiveOfficers,
                  as: "officer",
                  attributes: ["officerId"],
                  required: true,  
                  include: [
                      {
                          model: UserInformations,
                          as: "userInfos",
                          attributes: ["userName", "fullName"],  
                          required: true
                      }
                  ]
              }
          ],
          attributes: ["assigned_id", "customer_phone", "assigned_date"],
          limit: parseInt(limit, 10),  
          order: [[Sequelize.col("loan.outstanding_balance"), "DESC"]],
          offset: parseInt(offset, 10),  
          raw: true,  
          nest: true  
      });

      if (count > 0) {
          res.status(200).json({
              status: "Success",
              message: "Success",
              totalRecords: count,  
              totalPages: Math.ceil(count / limit),  
              currentPage: parseInt(page, 10),
              pageSize: parseInt(limit, 10),
              data: rows
          });
      } else {
          res.status(200).json({ 
            status: "Error",
            message: "No due loan assigned list history." 
          });
      }

  } catch (error) {
      console.error("Error fetching assigned loans:", error);
      res.status(500).json({
         status: "Error",
         message: "Internal server error" });
  }
};


module.exports = { assignLoans , getAssignedLoans, getUserAssignedLoans,getUserAssignedLoansHistory};
