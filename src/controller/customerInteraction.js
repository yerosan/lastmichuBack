const e = require("express");
const CustomerInteraction = require("../models/customerInteraction");
const ActualCollectionModel=require("../models/actualCollecttion")

const { AssignedLoans, ActiveOfficers, DueLoanData,UserInformations} = require("../models");

const { Sequelize, where } = require("sequelize");
const CollectionModel = require("../models/collectionModel");
const sequelize = require("../db/db"); // Import your Sequelize instance
const { stat } = require("fs");

const { Op} = require("sequelize");

const ECRModel=require("../models/emergencyContact")
const PTPModel=require("../models/promiseToPay");
const { off } = require("process");
const { get } = require("http");
const { console } = require("inspector");

const addInteraction = async (req, res) => {
    const transaction = await sequelize.transaction(); // Start a transaction
    await ECRModel.sync()
    await PTPModel.sync()
    try {
        const dataSet=req.body
        if(!dataSet.officer_id || 
            !dataSet.phone_number ||
            !dataSet.loan_id ||
            !dataSet.call_status ||
            !dataSet.call_response ||
            !dataSet.remark||
            !dataSet.date 
            ){ 
              return  res.status(200).json({
                    status:"Error",
                    message:"All field is required"})
            }

        let checkCustomerExistance= await CustomerInteraction.findOne({
            where:{
                loan_id:dataSet.loan_id,
                date:dataSet.date
            }
        })

        if(checkCustomerExistance){
            let interaction_id=checkCustomerExistance.dataValues.interaction_id
            const updatedInteraction = await CustomerInteraction.update({
                officer_id: dataSet.officer_id,
                phone_number: dataSet.phone_number,
                loan_id: dataSet.loan_id,
                call_status: dataSet.call_status,
                call_response: dataSet.call_response,
                remark: dataSet.remark || null,
                date: dataSet.date
            }, {
                where: { interaction_id: interaction_id },
                returning: true,  // To return the updated record
                transaction
            });

            if (updatedInteraction[0] === 0) { // No rows updated, meaning interaction_id wasn't found
                return res.status(200).json({ 
                    status:"Error",
                    message: "Interaction not found" });
            }

            const updatedInteractionData = updatedInteraction[1][0]; // Get the updated interaction record

            // 2. Update `collection_data` table using `interaction_id` to link
            const updatedCollectionData = await CollectionModel.update({
                userId: dataSet.officer_id,
                customerName: dataSet.customer_name || "Unknown",  // Default if not provided
                customerPhone: dataSet.phone_number,
                customerAccount: dataSet.saving_account || dataSet.loan_id, // Linking loan_id as customerAccount
                callResponce: dataSet.call_response,
                productType: dataSet.product_type || "loanId", // Optional field
                date: dataSet.date
            }, {
                where: { collectionId: interaction_id }, // The foreign key relation
                transaction
            });

            if (updatedCollectionData[0] === 0) { // No rows updated, meaning no matching collectionId
                return res.status(200).json({
                    status:"Error", 
                    message: "Collection data issue" });
            }    

            if (dataSet.call_response == "Promised to pay") {
                await PTPModel.upsert({
                    ptp_id: interaction_id,
                    officer_id: dataSet.officer_id,
                    phone_number: dataSet.phone_number,
                    loan_id: dataSet.loan_id,
                    remark:dataSet.remark,
                    ptp_date: dataSet.ptp_date,
                    date: dataSet.date
                }, { transaction });
            }
            
            if(dataSet.remark=="Emergency Contact"){
                const emergencyContactResponse=await ECRModel.upsert({
                    ecr_id:interaction_id,
                    officer_id:dataSet.officer_id,
                    phone_number:dataSet.phone_number,
                    loan_id:dataSet.loan_id,
                    emergency_response:dataSet.emergency_reponse,
                    date:dataSet.date
                }, { transaction })
                
            }

            // Commit the transaction if both updates succeed
            await transaction.commit();

            // Return the success response with updated data
            res.status(200).json({
                status:"Success",
                message: "Update successful",
                updatedInteraction: updatedInteractionData,
                updatedCollectionData
            });
                // res.status(200).json({
                //     status:"Error",
                //     message:"Customer already registered"})
        }else{
        // ✅ Insert into `customer_interactions` first
        const newInteraction = await CustomerInteraction.create({
            officer_id:dataSet.officer_id,
            phone_number:dataSet.phone_number,
            loan_id:dataSet.loan_id,
            call_status:dataSet.call_status,
            call_response:dataSet.call_response,
            remark:dataSet.remark || null,
            date:dataSet.date
        }, { transaction });

        // ✅ Insert into `collection_data` using the same `interaction_id`
        const newCollectionData = await CollectionModel.create({
            userId: dataSet.officer_id, 
            customerName: dataSet.customer_name || "Unknown", // Default if not provided
            customerPhone: dataSet.phone_number,
            customerAccount: dataSet.saving_account || dataSet.loan_id, // Linking loan_id as customerAccount
            callResponce: dataSet.call_response || dataSet.loan_id,
            productType: dataSet.productType || "loandId", // Optional field
            collectionId: newInteraction.interaction_id, // Linking with interaction_id from the previous insert,
            date:dataSet.date
        }, { transaction });

        
        if(dataSet.call_response=="Promised to pay"){
            const ptpResponse= await PTPModel.create({
               ptp_id:newInteraction.interaction_id,
               officer_id:dataSet.officer_id,
               phone_number:dataSet.phone_number,
               remark:dataSet.remark,
               loan_id:dataSet.loan_id,
               ptp_date:dataSet.ptp_date,
               date:dataSet.date
            }, { transaction })
          }
          if(dataSet.remark=="Emergency Contact"){
              const emergencyContactResponse=await ECRModel.create({
                  ecr_id:newInteraction.interaction_id,
                  officer_id:dataSet.officer_id,
                  phone_number:dataSet.phone_number,
                  loan_id:dataSet.loan_id,
                  emergency_response:dataSet.emergency_reponse,
                  date:dataSet.date
              }, { transaction })

          }

        // ✅ Commit transaction if both inserts succeed
        await transaction.commit();

        return res.status(200).json({ 
            status:"Success",
            message: "Registration Successful", 
            interaction: newInteraction, 
            collectionData: newCollectionData 
        });
    }
    } catch (error) {
        await transaction.rollback(); // Rollback if any insert fails
        console.error("Error adding interaction:", error);
        res.status(500).json({ 
            status:"Error",
            message: "Internal server error" });
    }
};





const PTPInteraction=async (req, res) => {
    const transaction = await sequelize.transaction(); // Start a transaction
    await ECRModel.sync()
    await PTPModel.sync()
    try {
        const dataSet=req.body
        if(!dataSet.officer_id || 
            !dataSet.phone_number ||
            !dataSet.loan_id ||
            !dataSet.call_status ||
            !dataSet.call_response ||
            !dataSet.remark||
            !dataSet.date ||
            !dataSet.ptp_id
            ){ 
              return  res.status(200).json({
                    status:"Error",
                    message:"All field is required"})
            }

        let checkCustomerExistance= await CustomerInteraction.findOne({
            where:{
                loan_id:dataSet.loan_id,
                date:dataSet.date
            }
        })

        if(checkCustomerExistance){
            let interaction_id=checkCustomerExistance.dataValues.interaction_id

            let promisedData= await PTPModel.update(
                {status:"noted"
                },
                {where:{ptp_id:dataSet.ptp_id},
                returning:true,
                transaction
            })

            const updatedInteraction = await CustomerInteraction.update({
                officer_id: dataSet.officer_id,
                phone_number: dataSet.phone_number,
                loan_id: dataSet.loan_id,
                call_status: dataSet.call_status,
                call_response: dataSet.call_response,
                remark: dataSet.remark || null,
                date: dataSet.date
            }, {
                where: { interaction_id: interaction_id },
                returning: true,  // To return the updated record
                transaction
            });

            if (updatedInteraction[0] === 0) { // No rows updated, meaning interaction_id wasn't found
                return res.status(200).json({ 
                    status:"Error",
                    message: "Interaction not found" });
            }

            const updatedInteractionData = updatedInteraction[1][0]; // Get the updated interaction record

            // 2. Update `collection_data` table using `interaction_id` to link
            const updatedCollectionData = await CollectionModel.update({
                userId: dataSet.officer_id,
                customerName: dataSet.customer_name || "Unknown",  // Default if not provided
                customerPhone: dataSet.phone_number,
                customerAccount: dataSet.saving_account || dataSet.loan_id, // Linking loan_id as customerAccount
                callResponce: dataSet.call_response,
                productType: dataSet.product_type || "loanId", // Optional field
                date: dataSet.date
            }, {
                where: { collectionId: interaction_id }, // The foreign key relation
                transaction
            });

            if (updatedCollectionData[0] === 0) { // No rows updated, meaning no matching collectionId
                return res.status(200).json({
                    status:"Error", 
                    message: "Collection data issue" });
            }    

            if (dataSet.call_response == "Promised to pay") {
                await PTPModel.upsert({
                    ptp_id: interaction_id,
                    officer_id: dataSet.officer_id,
                    phone_number: dataSet.phone_number,
                    loan_id: dataSet.loan_id,
                    remark:dataSet.remark,
                    ptp_date: dataSet.ptp_date,
                    date: dataSet.date
                }, { transaction });
            }
            
            if(dataSet.remark=="Emergency Contact"){
                const emergencyContactResponse=await ECRModel.upsert({
                    ecr_id:interaction_id,
                    officer_id:dataSet.officer_id,
                    phone_number:dataSet.phone_number,
                    loan_id:dataSet.loan_id,
                    emergency_response:dataSet.emergency_reponse,
                    date:dataSet.date
                }, { transaction })
                
            }

            // Commit the transaction if both updates succeed
            await transaction.commit();

            // Return the success response with updated data
            res.status(200).json({
                status:"Success",
                message: "Update successful",
                updatedInteraction: updatedInteractionData,
                updatedCollectionData
            });
                // res.status(200).json({
                //     status:"Error",
                //     message:"Customer already registered"})
        }else{
        // ✅ Insert into `customer_interactions` first
        let promisedData= await PTPModel.update(
            {status:"noted"
            },
            {where:{ptp_id:dataSet.ptp_id},
            returning:true,
            transaction
        })
        const newInteraction = await CustomerInteraction.create({
            officer_id:dataSet.officer_id,
            phone_number:dataSet.phone_number,
            loan_id:dataSet.loan_id,
            call_status:dataSet.call_status,
            call_response:dataSet.call_response,
            remark:dataSet.remark || null,
            date:dataSet.date
        }, { transaction });

        // ✅ Insert into `collection_data` using the same `interaction_id`
        const newCollectionData = await CollectionModel.create({
            userId: dataSet.officer_id, 
            customerName: dataSet.customer_name || "Unknown", // Default if not provided
            customerPhone: dataSet.phone_number,
            customerAccount: dataSet.saving_account || dataSet.loan_id, // Linking loan_id as customerAccount
            callResponce: dataSet.call_response || dataSet.loan_id,
            productType: dataSet.productType || "loandId", // Optional field
            collectionId: newInteraction.interaction_id, // Linking with interaction_id from the previous insert,
            date:dataSet.date
        }, { transaction });

        
        if(dataSet.call_response=="Promised to pay"){
            const ptpResponse= await PTPModel.create({
               ptp_id:newInteraction.interaction_id,
               officer_id:dataSet.officer_id,
               phone_number:dataSet.phone_number,
               remark:dataSet.remark,
               loan_id:dataSet.loan_id,
               ptp_date:dataSet.ptp_date,
               date:dataSet.date
            }, { transaction })
          }
          if(dataSet.remark=="Emergency Contact"){
              const emergencyContactResponse=await ECRModel.create({
                  ecr_id:newInteraction.interaction_id,
                  officer_id:dataSet.officer_id,
                  phone_number:dataSet.phone_number,
                  loan_id:dataSet.loan_id,
                  emergency_response:dataSet.emergency_reponse,
                  date:dataSet.date
              }, { transaction })

          }

        // ✅ Commit transaction if both inserts succeed
        await transaction.commit();

        return res.status(200).json({ 
            status:"Success",
            message: "Registration Successful", 
            interaction: newInteraction, 
            collectionData: newCollectionData 
        });
    }
    } catch (error) {
        await transaction.rollback(); // Rollback if any insert fails
        console.error("Error adding interaction:", error);
        res.status(500).json({ 
            status:"Error",
            message: "Internal server error" });
    }
};






const updateInteraction = async (req, res) => {
    const transaction = await sequelize.transaction(); // Start a transaction
    try {
        const dataSet = req.body;
        const interaction_id = dataSet.interaction_id; // Assuming interaction_id is passed in the URL parameters
        // Validate required fields for updating the interaction
        if (!dataSet.interaction_id ||
            !dataSet.officer_id || 
            !dataSet.phone_number ||
            !dataSet.loan_id ||
            !dataSet.call_status ||
            !dataSet.call_response ||
            !dataSet.date
        ) { 
            return res.status(400).json({ 
                status:"Error",
                message: "All fields are required" });
        }

        // 1. Update `customer_interactions` table
        const updatedInteraction = await CustomerInteraction.update({
            officer_id: dataSet.officer_id,
            phone_number: dataSet.phone_number,
            loan_id: dataSet.loan_id,
            call_status: dataSet.call_status,
            call_response: dataSet.call_response,
            remark: dataSet.remark || null,
            date: dataSet.date
        }, {
            where: { interaction_id: interaction_id },
            returning: true,  // To return the updated record
            transaction
        });

        if (updatedInteraction[0] === 0) { // No rows updated, meaning interaction_id wasn't found
            return res.status(200).json({ 
                status:"Error",
                message: "Interaction not found" });
        }

        const updatedInteractionData = updatedInteraction[1][0]; // Get the updated interaction record

        // 2. Update `collection_data` table using `interaction_id` to link
        const updatedCollectionData = await CollectionModel.update({
            userId: dataSet.officer_id,
            customerName: dataSet.customer_name || "Unknown",  // Default if not provided
            customerPhone: dataSet.phone_number,
            customerAccount: dataSet.saving_account || dataSet.loan_id, // Linking loan_id as customerAccount
            callResponce: dataSet.call_response,
            productType: dataSet.product_type || "loanId", // Optional field
            date: dataSet.date
        }, {
            where: { collectionId: interaction_id }, // The foreign key relation
            transaction
        });

        if (updatedCollectionData[0] === 0) { // No rows updated, meaning no matching collectionId
            return res.status(200).json({
                 status:"Error", 
                 message: "Collection data issue" });
        }

        // Commit the transaction if both updates succeed
        await transaction.commit();

        // Return the success response with updated data
        return res.status(200).json({
            status:"Success",
            message: "Update successful",
            updatedInteraction: updatedInteractionData,
            updatedCollectionData
        });

    } catch (error) {
        // Rollback transaction if any update fails
        await transaction.rollback();
        console.error("Error updating interaction:", error);
        res.status(500).json({ 
            status:"Error",
            message: "Internal server error" });
    }
};



const getInteractionsByDate = async (req, res) => {
    try {
        const { date, page = 1, limit = 10 } = req.body; // Pagination defaults

        if (!date) {
            return res.status(200).json({ 
                status:"Error",
                message: "Date are required." });
        }

        const offset = (page - 1) * limit;

        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: {date:{[Op.between]:[date.startDate, date.endDate]}},
            
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });


        if (count === 0) {
            return res.status(200).json({ 
                status:"Error",
                message: "No data found for the specified date." });
        }

        return res.status(200).json({
            status:"Success",
            message: "Succeed",
            totalRecords: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            data: interactions
        });

    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};






// const getInteractionsByOfficerAndDate = async (req, res) => {
//     try {
//         const { officer_id, date, page = 1, limit = 10, search,
//              call_response,} = req.body; 
//         if (!officer_id || !date) {
//             return res.status(400).json({
//                 status: "Error",
//                 message: "Officer ID and Date are required."
//             });
//         }

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
//         const whereClause = {
//             officer_id,
//             date:{[Op.between]:[date.startDate, date.endDate]},
//             call_status:"Contacted",
//             ...(call_response && { call_response }),
//             // call_response: callResponse ? { [Op.like]: `%${callResponse}%` } : { [Op.ne]: null },
//             ...(search && { phone_number: search }),  // Dynamically add search condition if provided
//         };

//         // Exclude loans that are "Fully Paid"
//         const excludedLoanIds = Sequelize.literal(`
//             customer_interactions.loan_id NOT IN (
//                 SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
//             ) 
//         `);

//         whereClause[Op.and] = [excludedLoanIds];
//         const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
//             where: whereClause,
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] },
//                     where:{collection_status:"Active"}
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
//             order: [["createdAt", "DESC"]],
//             limit: parseInt(limit, 10),
//             offset: parseInt(offset, 10),
//             raw: true,
//             nest: true
//         });

//         if (count === 0) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "No data found for the specified criteria."
//             });
//         }

//         return res.status(200).json({
//             status: "Success",
//             message: "Query successful.",
//             totalRecords: count,
//             currentPage: parseInt(page, 10),
//             totalPages: Math.ceil(count / limit),
//             data: interactions
//         });

//     } catch (error) {
//         console.error("Error fetching interactions:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error"
//         });
//     }
// };




// const getInteractionsByOfficerAndDate = async (req, res) => {
//     try {
//         const { officer_id, date, page = 1, limit = 10, search, call_response } = req.body;

//         if (!officer_id) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "Officer ID and Date are required."
//             });
//         }

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);


//                 // Exclude loans that are "Fully Paid"
//         const excludedLoanIds = Sequelize.literal(`
//             customer_interactions.loan_id NOT IN (
//                 SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
//             ) 
//         `);

//         // whereClause[Op.and] = [excludedLoanIds];

//         // Get the latest "Contacted" interaction per customer
//         // const recentInteractions = await CustomerInteraction.findAll({
//         //     attributes: [
//         //         "loan_id",
//         //         "interaction_id", 
//         //         "call_status",
//         //         [Sequelize.fn("MAX", Sequelize.col("createdAt")), "latestInteraction"]
//         //     ],
//         //     where: {
//         //         officer_id,
//         //         // date: { [Op.between]: [date.startDate, date.endDate] },
//         //         call_status: "Contacted",
//         //         [Op.and] : [excludedLoanIds]
//         //     },
//         //     group: ["loan_id"],
//         //     raw: true
//         // });


//         // const recentInteractions = await CustomerInteraction.findAll({
//         //     attributes: [
//         //         "loan_id",      // Unique per customer
//         //         "interaction_id",
//         //         "call_status",
//         //         "createdAt"
//         //     ],
//         //     where: {
//         //         officer_id,
//         //         call_status: "Contacted",
//         //         [Op.and]: [excludedLoanIds]
//         //     },
//         //     order: [
//         //         ["loan_id", "ASC"],       // Ensure unique loan_id grouping
//         //         ["createdAt", "DESC"]     // Get the latest interaction first
//         //     ],
//         //     group: ["loan_id"], // Picks the most recent "Contacted" interaction per loan_id
//         //     raw: true
//         // });
        
//         const recentInteractions = await CustomerInteraction.findAll({
//             attributes: [
//                 "loan_id",
//                 "interaction_id",
//                 "call_status",
//                 "createdAt",
//                 "phone_number"
//             ],
//             where: {
//                 officer_id,
//                 call_status: "Contacted",
//                 [Op.and]: [excludedLoanIds],
//                 createdAt: {
//                     [Op.in]: Sequelize.literal(
//                         `(SELECT MAX(createdAt) FROM customer_interactions ci WHERE ci.loan_id = customer_interactions.loan_id AND ci.call_status = 'Contacted' GROUP BY ci.loan_id)`
//                     )
//                 }
//             },
//             raw: true,
//         });        

//         console.log("--------------------------------Created at----------------", recentInteractions)
//         const latestInteractionTimestamps = recentInteractions.map(interaction => interaction.latestInteraction);

//         if (latestInteractionTimestamps.length === 0) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "No data found for the specified criteria."
//             });
//         }

//         // Query full data for the latest interactions
//         const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
//             where: {
//                 officer_id,
//                 createdAt: { [Op.in]: latestInteractionTimestamps }, // Ensures only the most recent interactions are selected
//                 ...(call_response && { call_response }),
//                 ...(search && { phone_number: search })
//             },
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] },
//                     where: { collection_status: "Active" }
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
//             order: [["createdAt", "DESC"]],
//             limit: parseInt(limit, 10),
//             offset: parseInt(offset, 10),
//             raw: true,
//             nest: true
//         });

//         return res.status(200).json({
//             status: "Success",
//             message: "Data generated successful.",
//             totalRecords: count,
//             currentPage: parseInt(page, 10),
//             totalPages: Math.ceil(count / limit),
//             data: interactions
//         });

//     } catch (error) {
//         console.error("Error fetching interactions:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error"
//         });
//     }
// };





const getInteractionsByOfficerAndDate = async (req, res) => {
    try {
        const { officer_id, page = 1, limit = 10, search, call_response } = req.body;

        if (!officer_id) {
            return res.status(200).json({
                status: "Error",
                message: "Officer ID is required."
            });
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Exclude fully paid loans
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            )
        `);

        // Get the most recent interaction for each loan_id
        const subQuery = `
            SELECT ci.interaction_id 
            FROM customer_interactions ci
            INNER JOIN (
                SELECT loan_id, MAX(createdAt) as max_date
                FROM customer_interactions
                WHERE officer_id = :officer_id
                GROUP BY loan_id
            ) latest ON ci.loan_id = latest.loan_id AND ci.createdAt = latest.max_date
        `;

        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: {
                officer_id,
                call_status: "Contacted",
                interaction_id: {
                    [Op.in]: Sequelize.literal(`(${subQuery})`),
                },
                [Op.and]: [excludedLoanIds],
                ...(call_response && { call_response }),
                ...(search && { phone_number: search })
            },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    where: { collection_status: "Active" }
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            replacements: { officer_id },
            raw: true,
            nest: true
        });
        
        
        if (interactions.length === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No data found for the specified criteria."
            });
        }

        // 🔹 Step 3: Fetch Collection Data for Each Loan
        const loanIds = interactions.map(i => i.loan?.loan_id).filter(Boolean); // Extract loan IDs

        let collectionData = [];
        if (loanIds.length > 0) {
            collectionData = await ActualCollectionModel.findAll({
                attributes: [
                    "loan_id",
                    [Sequelize.fn("SUM", Sequelize.col("total_collected")), "total_paid"]
                ],
                where: { loan_id: { [Op.in]: loanIds } },
                group: ["loan_id"],
                raw: true
            });
        }

        // 🔹 Step 4: Merge Collection Data (Ensure Zero if Not Found)
        const collectionMap = collectionData.reduce((acc, curr) => {
            acc[curr.loan_id] = curr.total_paid || 0;
            return acc;
        }, {});

        const finalData = interactions.map(interaction => ({
            ...interaction,
            loan: {
                ...interaction.loan,
                total_paid: collectionMap[interaction.loan?.loan_id] || 0 // Assign 0 if no payments
            }
        }));

        return res.status(200).json({
            status: "Success",
            message: "Data generated successfully.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: finalData
        });

    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
};








const getNotContactedInteractionsByOfficerAndDate = async (req, res) => {
    try {
        const { officer_id, page = 1, limit = 10, search, call_response } = req.body;

        if (!officer_id) {
            return res.status(200).json({
                status: "Error",
                message: "Officer ID is required."
            });
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Exclude fully paid loans
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            )
        `);

        // Get the most recent interaction for each loan_id
        const subQuery = `
            SELECT ci.interaction_id 
            FROM customer_interactions ci
            INNER JOIN (
                SELECT loan_id, MAX(createdAt) as max_date
                FROM customer_interactions
                WHERE officer_id = :officer_id
                GROUP BY loan_id
            ) latest ON ci.loan_id = latest.loan_id AND ci.createdAt = latest.max_date
        `;

        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: {
                officer_id,
                call_status: "Not contacted",
                interaction_id: {
                    [Op.in]: Sequelize.literal(`(${subQuery})`),
                },
                [Op.and]: [excludedLoanIds],
                ...(call_response && { call_response }),
                ...(search && { phone_number: search })
            },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    where: { collection_status: "Active" }
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            replacements: { officer_id },
            raw: true,
            nest: true
        });
        
        
        if (interactions.length === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No data found for the specified criteria."
            });
        }

        // 🔹 Step 3: Fetch Collection Data for Each Loan
        const loanIds = interactions.map(i => i.loan?.loan_id).filter(Boolean); // Extract loan IDs

        let collectionData = [];
        if (loanIds.length > 0) {
            collectionData = await ActualCollectionModel.findAll({
                attributes: [
                    "loan_id",
                    [Sequelize.fn("SUM", Sequelize.col("total_collected")), "total_paid"]
                ],
                where: { loan_id: { [Op.in]: loanIds } },
                group: ["loan_id"],
                raw: true
            });
        }

        // 🔹 Step 4: Merge Collection Data (Ensure Zero if Not Found)
        const collectionMap = collectionData.reduce((acc, curr) => {
            acc[curr.loan_id] = curr.total_paid || 0;
            return acc;
        }, {});

        const finalData = interactions.map(interaction => ({
            ...interaction,
            loan: {
                ...interaction.loan,
                total_paid: collectionMap[interaction.loan?.loan_id] || 0 // Assign 0 if no payments
            }
        }));

        return res.status(200).json({
            status: "Success",
            message: "Data generated successfully.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: finalData
        });

    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
};





const getNotContactedInteractions = async (req, res) => {
    try {
        const { officer_id, page = 1, limit = 10, search, call_response } = req.body;

        // if (!officer_id) {
        //     return res.status(200).json({
        //         status: "Error",
        //         message: "Officer ID is required."
        //     });
        // }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Exclude fully paid loans
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            )
        `);

        // Get the most recent interaction for each loan_id
        const subQuery = `
            SELECT ci.interaction_id 
            FROM customer_interactions ci
            INNER JOIN (
                SELECT loan_id, MAX(createdAt) as max_date
                FROM customer_interactions
                GROUP BY loan_id
            ) latest ON ci.loan_id = latest.loan_id AND ci.createdAt = latest.max_date
        `;

        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: {
                ...(officer_id && {officer_id}),
                call_status: "Not contacted",
                interaction_id: {
                    [Op.in]: Sequelize.literal(`(${subQuery})`),
                },
                [Op.and]: [excludedLoanIds],
                ...(call_response && { call_response }),
                ...(search && { phone_number: search })
            },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    where: { collection_status: "Active" }
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            replacements: { officer_id },
            raw: true,
            nest: true
        });
        
        
        if (interactions.length === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No data found for the specified criteria."
            });
        }

        // 🔹 Step 3: Fetch Collection Data for Each Loan
        const loanIds = interactions.map(i => i.loan?.loan_id).filter(Boolean); // Extract loan IDs

        let collectionData = [];
        if (loanIds.length > 0) {
            collectionData = await ActualCollectionModel.findAll({
                attributes: [
                    "loan_id",
                    [Sequelize.fn("SUM", Sequelize.col("total_collected")), "total_paid"]
                ],
                where: { loan_id: { [Op.in]: loanIds } },
                group: ["loan_id"],
                raw: true
            });
        }

        // 🔹 Step 4: Merge Collection Data (Ensure Zero if Not Found)
        const collectionMap = collectionData.reduce((acc, curr) => {
            acc[curr.loan_id] = curr.total_paid || 0;
            return acc;
        }, {});

        const finalData = interactions.map(interaction => ({
            ...interaction,
            loan: {
                ...interaction.loan,
                total_paid: collectionMap[interaction.loan?.loan_id] || 0 // Assign 0 if no payments
            }
        }));

        return res.status(200).json({
            status: "Success",
            message: "Data generated successfully.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: finalData
        });

    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
};



// const getInteractionsByOfficerAndDate = async (req, res) => {
//     try {
//         const { officer_id, date, page = 1, limit = 10, search, call_response } = req.body;

//         if (!officer_id) {
//             return res.status(400).json({
//                 status: "Error",
//                 message: "Officer ID and Date are required."
//             });
//         }

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

//         // Exclude loans that are "Fully Paid"
//         const excludedLoanIds = Sequelize.literal(`
//             customer_interactions.loan_id NOT IN (
//                 SELECT payments.loan_id FROM payments WHERE payment_type = 'Fully Paid'
//             )
//         `);

//         // Get the latest "Contacted" interaction per customer
//         const recentInteractions = await CustomerInteraction.findAll({
//             attributes: [
//                 "loan_id",
//                 [Sequelize.fn("MAX", Sequelize.col("createdAt")), "latestInteraction"]
//             ],
//             where: {
//                 officer_id,
//                 call_status: "Contacted",
//                 [Op.and]: [excludedLoanIds]
//             },
//             group: ["loan_id"],
//             raw: true
//         });

//         const latestInteractionTimestamps = recentInteractions.map(interaction => interaction.latestInteraction);

//         if (latestInteractionTimestamps.length === 0) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "No data found for the specified criteria."
//             });
//         }

//         // Query full data for the latest interactions
//         const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
//             where: {
//                 officer_id,
//                 createdAt: { [Op.in]: latestInteractionTimestamps }, // Get latest interactions
//                 ...(call_response && { call_response }),
//                 ...(search && { phone_number: search })
//             },
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: ["loan_id", "amount", "due_date", "collection_status"],
//                     where: { collection_status: "Active" }, // Ensure only active loans
//                     include: [
//                         {
//                             model: ActualCollectionModel, // The table storing payments
//                             as: "collections",
//                             attributes: [
//                                 [Sequelize.fn("COALESCE", Sequelize.fn("SUM", Sequelize.col("amount_collected")), 0), "total_paid"]
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
//             order: [["createdAt", "DESC"]],
//             limit: parseInt(limit, 10),
//             offset: parseInt(offset, 10),
//             raw: true,
//             nest: true
//         });

//         consolelog("------------------------------Payment-------------", interactions)
//         return res.status(200).json({
//             status: "Success",
//             message: "Data fetched successfully.",
//             totalRecords: count,
//             currentPage: parseInt(page, 10),
//             totalPages: Math.ceil(count / limit),
//             data: interactions
//         });

//     } catch (error) {
//         console.error("Error fetching interactions:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error"
//         });
//     }
// };





// const getInteractionsByOfficerAndDate = async (req, res) => {
//     try {
//         const { officer_id, page = 1, limit = 10, search, call_response } = req.body;

//         if (!officer_id) {
//             return res.status(400).json({
//                 status: "Error",
//                 message: "Officer ID and Date are required."
//             });
//         }

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

//         // 🔹 Step 1: Get the latest "Contacted" interaction per loan_id
//         const latestInteractions = await CustomerInteraction.findAll({
//             attributes: [
//                 "interaction_id",
//                 [Sequelize.fn("MAX", Sequelize.col("createdAt")), "latestInteraction"]
//             ],
//             where: {
//                 officer_id,
//                 call_status: "Contacted",
//                 ...(search && { phone_number: search })
//             },
//             group: ["interaction_id"],
//             raw: true
//         });

//         const latestInteractionTimestamps = latestInteractions.map(interaction => interaction.latestInteraction);

//         if (latestInteractionTimestamps.length === 0) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "No data found for the specified criteria."
//             });
//         }

//         // 🔹 Step 2: Fetch Interactions with Loan Data
//         const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
//             where: {
//                 officer_id,
//                 createdAt: { [Op.in]: latestInteractionTimestamps }, // Get latest interactions
//                 ...(call_response && { call_response }),
//                 ...(search && { phone_number: search })
//             },
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] },
//                     where: { collection_status: "Active" }
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
//             order: [["createdAt", "DESC"]],
//             limit: parseInt(limit, 10),
//             offset: parseInt(offset, 10),
//             raw: true,
//             nest: true
//         });

//         // 🔹 Step 3: Fetch Collection Data for Each Loan
//         const loanIds = interactions.map(i => i.loan?.loan_id).filter(Boolean); // Extract loan IDs

//         let collectionData = [];
//         if (loanIds.length > 0) {
//             collectionData = await ActualCollectionModel.findAll({
//                 attributes: [
//                     "loan_id",
//                     [Sequelize.fn("SUM", Sequelize.col("total_collected")), "total_paid"]
//                 ],
//                 where: { loan_id: { [Op.in]: loanIds } },
//                 group: ["loan_id"],
//                 raw: true
//             });
//         }

//         // 🔹 Step 4: Merge Collection Data (Ensure Zero if Not Found)
//         const collectionMap = collectionData.reduce((acc, curr) => {
//             acc[curr.loan_id] = curr.total_paid || 0;
//             return acc;
//         }, {});

//         const finalData = interactions.map(interaction => ({
//             ...interaction,
//             loan: {
//                 ...interaction.loan,
//                 total_paid: collectionMap[interaction.loan?.loan_id] || 0 // Assign 0 if no payments
//             }
//         }));
//         return res.status(200).json({
//             status: "Success",
//             message: "Data fetched successfully.",
//             totalRecords: count,
//             currentPage: parseInt(page, 10),
//             totalPages: Math.ceil(count / limit),
//             data: finalData
//         });

//     } catch (error) {
//         console.error("❌ Error fetching interactions:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error"
//         });
//     }
// };







// const getNotContactedInteractionsByOfficerAndDate = async (req, res) => {
//     try {
//         const { officer_id, page = 1, limit = 10, search, call_response } = req.body;

//         console.log("-------------------------",search)

//         if (!officer_id) {
//             return res.status(400).json({
//                 status: "Error",
//                 message: "Officer ID and Date are required."
//             });
//         }

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

//         // 🔹 Step 1: Get the latest "Contacted" interaction per loan_id
//         const latestInteractions = await CustomerInteraction.findAll({
//             attributes: [
//                 "interaction_id",
//                 "loan_id",
//                 [Sequelize.fn("MAX", Sequelize.col("createdAt")), "latestInteraction"]
//             ],
//             where: {
//                 officer_id,
//                 call_status:"Not contacted",
//                 ...(search && { phone_number: search })
//             },
//             group: ["interaction_id"],
//             raw: true
//         });


//         const latestInteractionTimestamps = latestInteractions.map(interaction => interaction.latestInteraction);

//         if (latestInteractionTimestamps.length === 0) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "No data found for the specified criteria."
//             });
//         }

//         // 🔹 Step 2: Fetch Interactions with Loan Data
//         const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
//             where: {
//                 officer_id,
//                 createdAt: { [Op.in]: latestInteractionTimestamps }, // Get latest interactions
//                 ...(call_response && { call_response }),
//                 ...(search && { phone_number: search })
//             },
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] },
//                     where: { collection_status: "Active" }
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
//             order: [["createdAt", "DESC"]],
//             limit: parseInt(limit, 10),
//             offset: parseInt(offset, 10),
//             raw: true,
//             nest: true
//         });

//         // 🔹 Step 3: Fetch Collection Data for Each Loan
//         const loanIds = interactions.map(i => i.loan?.loan_id).filter(Boolean); // Extract loan IDs

//         let collectionData = [];
//         if (loanIds.length > 0) {
//             collectionData = await ActualCollectionModel.findAll({
//                 attributes: [
//                     "loan_id",
//                     [Sequelize.fn("SUM", Sequelize.col("total_collected")), "total_paid"]
//                 ],
//                 where: { loan_id: { [Op.in]: loanIds } },
//                 group: ["loan_id"],
//                 raw: true
//             });
//         }

//         // 🔹 Step 4: Merge Collection Data (Ensure Zero if Not Found)
//         const collectionMap = collectionData.reduce((acc, curr) => {
//             acc[curr.loan_id] = curr.total_paid || 0;
//             return acc;
//         }, {});

//         const finalData = interactions.map(interaction => ({
//             ...interaction,
//             loan: {
//                 ...interaction.loan,
//                 total_paid: collectionMap[interaction.loan?.loan_id] || 0 // Assign 0 if no payments
//             }
//         }));
//         return res.status(200).json({
//             status: "Success",
//             message: "Data fetched successfully.",
//             totalRecords: count,
//             currentPage: parseInt(page, 10),
//             totalPages: Math.ceil(count / limit),
//             data: finalData
//         });

//     } catch (error) {
//         console.error("❌ Error fetching interactions:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error"
//         });
//     }
// };







// const getNotContactedInteractionsByOfficerAndDate = async (req, res) => {
//     try {
//         const { officer_id, date, page = 1, limit = 10, search, call_response } = req.body;

//         if (!officer_id) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "Officer ID and Date are required."
//             });
//         }

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);


//         // Exclude loans that are "Fully Paid"
//         const excludedLoanIds = Sequelize.literal(`
//             customer_interactions.loan_id NOT IN (
//                 SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
//             ) 
//         `);

//         // whereClause[Op.and] = [excludedLoanIds];

//         // Get the latest "Not contacted" interaction per customer
//         const recentInteractions = await CustomerInteraction.findAll({
//             attributes: [
//                 "interaction_id",
//                 [Sequelize.fn("MAX", Sequelize.col("createdAt")), "latestInteraction"]
//             ],
//             where: {
//                 officer_id,
//                 // date: { [Op.between]: [date.startDate, date.endDate] },
//                 call_status: "Not contacted",
//                 [Op.and] : [excludedLoanIds]
//             },
//             group: ["interaction_id"],
//             raw: true
//         });

//         const latestInteractionTimestamps = recentInteractions.map(interaction => interaction.latestInteraction);

//         if (latestInteractionTimestamps.length === 0) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "No data found for the specified criteria."
//             });
//         }

//         // Query full data for the latest interactions
//         const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
//             where: {
//                 officer_id,
//                 createdAt: { [Op.in]: latestInteractionTimestamps }, // Ensures only the most recent interactions are selected
//                 ...(call_response && { call_response }),
//                 ...(search && { phone_number: search })
//             },
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] },
//                     where: { collection_status: "Active" }
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
//             order: [["createdAt", "DESC"]],
//             limit: parseInt(limit, 10),
//             offset: parseInt(offset, 10),
//             raw: true,
//             nest: true
//         });

//         return res.status(200).json({
//             status: "Success",
//             message: "Data generated successful.",
//             totalRecords: count,
//             currentPage: parseInt(page, 10),
//             totalPages: Math.ceil(count / limit),
//             data: interactions
//         });

//     } catch (error) {
//         console.error("Error fetching interactions:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error"
//         });
//     }
// };






// const getNotContactedInteractionsByOfficerAndDate = async (req, res) => {
//     try {
//         const { officer_id, date, page = 1, limit = 10, search,
//              call_response,} = req.body; 

//         // console.log("==================The data========-----------", date,call_status, search, callResponse)

//         // Validate required fields
//         if (!officer_id || !date) {
//             return res.status(400).json({
//                 status: "Error",
//                 message: "Officer ID and Date are required."
//             });
//         }

//         const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
//         const whereClause = {
//             officer_id,
//             call_status:"Not contacted",
//             date:{[Op.between]:[date.startDate, date.endDate]},
//             ...(call_response && { call_response }),
//             ...(search && { phone_number: { [Op.like]: `%${search}%` } }),  // Dynamically add search condition if provided
//         };

//         // Exclude loans that are "Fully Paid"
//         const excludedLoanIds = Sequelize.literal(`
//             customer_interactions.loan_id NOT IN (
//                 SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
//             ) 
//         `);

//         // Apply filtering dynamically
//         // if (loan_status) {
//         //     whereClause[Op.and] = [
//         //         excludedLoanIds,
//         //         Sequelize.literal(`loan.loan_status = '${loan_status}'`)  // Dynamic loan status filter
//         //     ];
//         // } else {
//         whereClause[Op.and] = [excludedLoanIds];
//         // }

//         // Fetch interactions
//         const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
//             where: whereClause,
//             include: [
//                 {
//                     model: DueLoanData,
//                     as: "loan",
//                     attributes: { exclude: ["createdAt", "updatedAt"] },
//                     where:{collection_status:"Active"}
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
//             order: [["createdAt", "DESC"]],
//             limit: parseInt(limit, 10),
//             offset: parseInt(offset, 10),
//             raw: true,
//             nest: true
//         });

//         if (count === 0) {
//             return res.status(200).json({
//                 status: "Error",
//                 message: "No data found for the specified criteria."
//             });
//         }

//         return res.status(200).json({
//             status: "Success",
//             message: "Query successful.",
//             totalRecords: count,
//             currentPage: parseInt(page, 10),
//             totalPages: Math.ceil(count / limit),
//             data: interactions
//         });

//     } catch (error) {
//         console.error("Error fetching interactions:", error);
//         res.status(500).json({
//             status: "Error",
//             message: "Internal server error"
//         });
//     }
// };




const getNotContactedInteractionsByOfficer = async (req, res) => {
    try {
        const { officer_id, page = 1, limit = 10, search, call_response } = req.body;

        // Validate required fields
        if (!officer_id) {
            return res.status(400).json({
                status: "Error",
                message: "Officer ID is required."
            });
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Subquery to get the most recent interaction for each loan
        const latestInteractionsSubquery = `
            SELECT ci1.*
            FROM customer_interactions ci1
            INNER JOIN (
                SELECT loan_id, MAX(createdAt) as latest_date
                FROM customer_interactions
                GROUP BY loan_id
            ) ci2 ON ci1.loan_id = ci2.loan_id 
            AND ci1.createdAt = ci2.latest_date
            WHERE ci1.call_status = 'Not contacted'
        `;

        // Exclude fully paid loans
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            )
        `);

        const whereClause = {
            officer_id,
            [Op.and]: [
                excludedLoanIds,
                Sequelize.literal(`customer_interactions.interaction_id IN (${latestInteractionsSubquery})`)
            ],
            ...(call_response && { call_response }),
            ...(search && { phone_number: { [Op.like]: `%${search}%` } })
        };

        // Fetch interactions
        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    required: true
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            distinct: true,
            raw: true,
            nest: true
        });

        // Get interaction history for each loan
        const interactionsWithHistory = await Promise.all(
            interactions.map(async (interaction) => {
                const history = await CustomerInteraction.findAll({
                    where: { loan_id: interaction.loan_id },
                    order: [["createdAt", "DESC"]],
                    raw: true,
                    limit: 5 // Get last 5 interactions for history
                });

                return {
                    ...interaction,
                    interaction_history: history
                };
            })
        );

        if (count === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No customers with recent not contacted status found."
            });
        }

        return res.status(200).json({
            status: "Success",
            message: "Query successful.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: interactionsWithHistory
        });

    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            error: error.message
        });
    }
};



const getContactedInteractionsByOfficer = async (req, res) => {
    try {
        const { officer_id, page = 1, limit = 10, search, call_response } = req.body;

        // Validate required fields
        if (!officer_id) {
            return res.status(400).json({
                status: "Error",
                message: "Officer ID is required."
            });
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        // interaction_id
        // Subquery to get the most recent interaction for each loan where status is Contacted
        const latestInteractionsSubquery = `
            SELECT ci1.*
            FROM customer_interactions ci1
            INNER JOIN (
                SELECT loan_id, MAX(createdAt) as latest_date
                FROM customer_interactions
                GROUP BY loan_id
            ) ci2 ON ci1.loan_id = ci2.loan_id 
            AND ci1.createdAt = ci2.latest_date
            WHERE ci1.call_status = 'Contacted'
        `;

        // Exclude fully paid loans
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            )
        `);

        const whereClause = {
            officer_id,
            [Op.and]: [
                excludedLoanIds,
                Sequelize.literal(`customer_interactions.interaction_id IN (${latestInteractionsSubquery})`)
            ],
            ...(call_response && { call_response }),
            ...(search && { phone_number: { [Op.like]: `%${search}%` } })
        };

        // Fetch interactions
        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    required: true
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            distinct: true,
            raw: true,
            nest: true
        });

        // Get interaction history for each loan
        const interactionsWithHistory = await Promise.all(
            interactions.map(async (interaction) => {
                const history = await CustomerInteraction.findAll({
                    where: { loan_id: interaction.loan_id },
                    order: [["createdAt", "DESC"]],
                    raw: true,
                    limit: 5 // Get last 5 interactions for history
                });

                return {
                    ...interaction,
                    interaction_history: history
                };
            })
        );

        if (count === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No customers with recent contacted status found."
            });
        }

        return res.status(200).json({
            status: "Success",
            message: "Successfully retrieved contacted customers.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: interactionsWithHistory
        });

    } catch (error) {
        console.error("Error fetching contacted interactions:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            error: error.message
        });
    }
};





const getContactedInteractions = async (req, res) => {
    try {
        const { officer_id, page = 1, limit = 10, search, call_response,date } = req.body;
        // Or use more specific logging levels
        console.info('Info message');
        console.error('Error message');
        console.warn('Warning message');

        // if (!officer_id) {
        //     return res.status(200).json({
        //         status: "Error",
        //         message: "Officer ID is required."
        //     });
        // }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Exclude fully paid loans
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            )
        `);

        // Get the most recent interaction for each loan_id
        const subQuery = `
            SELECT ci.interaction_id 
            FROM customer_interactions ci
            INNER JOIN (
                SELECT loan_id, MAX(createdAt) as max_date
                FROM customer_interactions
                GROUP BY loan_id
            ) latest ON ci.loan_id = latest.loan_id AND ci.createdAt = latest.max_date
        `;

        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: {
                ...(officer_id&& {officer_id}),
                call_status: "Contacted",
                interaction_id: {
                    [Op.in]: Sequelize.literal(`(${subQuery})`),
                },
                [Op.and]: [excludedLoanIds],
                ...(call_response && { call_response }),
                ...(search && { phone_number: search }),
                ...(date && {date:{[Op.between]:[date.startDate, date.endDate]}})
            },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    where: { collection_status: "Active" }
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            replacements: { officer_id },
            raw: true,
            nest: true
        });
        
        
        if (interactions.length === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No data found for the specified criteria."
            });
        }

        // 🔹 Step 3: Fetch Collection Data for Each Loan
        const loanIds = interactions.map(i => i.loan?.loan_id).filter(Boolean); // Extract loan IDs

        let collectionData = [];
        if (loanIds.length > 0) {
            collectionData = await ActualCollectionModel.findAll({
                attributes: [
                    "loan_id",
                    [Sequelize.fn("SUM", Sequelize.col("total_collected")), "total_paid"]
                ],
                where: { loan_id: { [Op.in]: loanIds } },
                group: ["loan_id"],
                raw: true
            });
        }

        // 🔹 Step 4: Merge Collection Data (Ensure Zero if Not Found)
        const collectionMap = collectionData.reduce((acc, curr) => {
            acc[curr.loan_id] = curr.total_paid || 0;
            return acc;
        }, {});

        const finalData = interactions.map(interaction => ({
            ...interaction,
            loan: {
                ...interaction.loan,
                total_paid: collectionMap[interaction.loan?.loan_id] || 0 // Assign 0 if no payments
            }
        }));

        return res.status(200).json({
            status: "Success",
            message: "Data generated successfully.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: finalData
        });

    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
};




// const promiseTopay= async(req, res)=>{
//     const data=req.body

//     console.log("The data interaction set ============----------------", data)

//     if(!data.officer_id){
//         res.status(200).json({
//             status:"error",
//             message:"Officer id is required"
//         })
//     }else{
//         try {
//             const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
//             console.log("The data interaction set ============----from off set------------", data)
//             const { count, rows } = await PTPModel.findAndCountAll({
//                 where: {
//                     officer_id: data.officer_id,
//                     ...(data.search && { phone_number: data.search }),
//                 },
//                 include: [
//                     {
//                         model: DueLoanData,
//                         as: "loan",
//                         attributes: { exclude: ["createdAt", "updatedAt"] },
//                         where: { collection_status: "Active" }
//                     },
//                     {
//                         model: ActiveOfficers,
//                         as: "officer",
//                         attributes: ["officerId"],
//                         required: true,
//                         include: [
//                             {
//                                 model: UserInformations,
//                                 as: "userInfos",
//                                 attributes: ["userName", "fullName"],
//                                 required: true
//                             }
//                         ]
//                     }
//                 ],
//                 order: [["createdAt", "DESC"]],
//                 limit: parseInt(data.limit, 10),
//                 offset: parseInt(offset, 10),
//                 raw: true,
//                 nest: true
//             });
    
//             if (count > 0) {
//                 res.status(200).json({
//                     status: "Success",
//                     message: "Success",
//                     totalRecords: count,
//                     data: rows
//                 });
//             } else {
//                 res.status(200).json({
//                     status: "error",
//                     message: "No data found for the specified criteria."
//                 });
//             }
//         } catch (error) {
//             console.log("Error fetching interactions:", error);
//             res.status(500).json({
//                 status: "error",
//                 message: "Internal server error"
//             });
//         }
//     }
// }






const promiseTopay = async (req, res) => {
    const data = req.body;
    const { page = 1, limit = 10,date } = data; // Default values added

    if (!data.officer_id) {
        return res.status(200).json({
            status: "error",
            message: "Officer id is required"
        });
    }

    try {
        if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
            return res.status(200).json({
                status: "error",
                message: "Invalid page or limit parameters"
            });
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        const { count, rows } = await PTPModel.findAndCountAll({
            where: {
                officer_id: data.officer_id,
                status: "notable",
                ...(data.search && { phone_number: data.search }),
                ...(date.startDate && date.endDate && {ptp_date:{[Op.between]:[date.startDate, date.endDate]}})
            },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    where: { collection_status: "Active" }
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
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit, 10),
            offset,
            raw: true,
            nest: true
        });

        if (count > 0) {
            return res.status(200).json({
                status: "success",
                message: "Success",
                totalRecords: count,
                data: rows
            });
        }

        return res.status(200).json({
            status: "error",
            message: "No data found for the specified criteria."
        });

    } catch (error) {
        console.log("error fetching interactions:", error);
        // throw ("Test error", error)
        return res.status(500).json({
            status: "error from the ceatch",
            message: "Internal server error"
        });
    }
};




module.exports = { addInteraction, getInteractionsByDate ,
                   updateInteraction, getInteractionsByOfficerAndDate,
                   getNotContactedInteractionsByOfficerAndDate,
                   getNotContactedInteractions,
                   getContactedInteractions,
                   promiseTopay,PTPInteraction
                };