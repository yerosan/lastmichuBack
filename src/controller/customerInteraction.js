const e = require("express");
const CustomerInteraction = require("../models/customerInteraction");

const { AssignedLoans, ActiveOfficers, DueLoanData,UserInformations} = require("../models");

const { Sequelize, where } = require("sequelize");
const CollectionModel = require("../models/collectionModel");
const sequelize = require("../db/db"); // Import your Sequelize instance
const { stat } = require("fs");

const { Op} = require("sequelize");

const ECRModel=require("../models/emergencyContact")
const PTPModel=require("../models/promiseToPay");
const { off } = require("process");

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






const getInteractionsByOfficerAndDate = async (req, res) => {
    try {
        const { officer_id, date, page = 1, limit = 10, search,
             call_response,} = req.body; 
        if (!officer_id || !date) {
            return res.status(400).json({
                status: "Error",
                message: "Officer ID and Date are required."
            });
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const whereClause = {
            officer_id,
            date:{[Op.between]:[date.startDate, date.endDate]},
            call_status:"Contacted",
            ...(call_response && { call_response }),
            // call_response: callResponse ? { [Op.like]: `%${callResponse}%` } : { [Op.ne]: null },
            ...(search && { phone_number: search }),  // Dynamically add search condition if provided
        };

        // Exclude loans that are "Fully Paid"
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            ) 
        `);

        whereClause[Op.and] = [excludedLoanIds];
        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] }
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
            raw: true,
            nest: true
        });

        if (count === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No data found for the specified criteria."
            });
        }

        return res.status(200).json({
            status: "Success",
            message: "Query successful.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: interactions
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
        const { officer_id, date, page = 1, limit = 10, search,
             call_response,} = req.body; 

        // console.log("==================The data========-----------", date,call_status, search, callResponse)

        // Validate required fields
        if (!officer_id || !date) {
            return res.status(400).json({
                status: "Error",
                message: "Officer ID and Date are required."
            });
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const whereClause = {
            officer_id,
            call_status:"Not contacted",
            date:{[Op.between]:[date.startDate, date.endDate]},
            ...(call_response && { call_response }),
            ...(search && { phone_number: { [Op.like]: `%${search}%` } }),  // Dynamically add search condition if provided
        };

        // Exclude loans that are "Fully Paid"
        const excludedLoanIds = Sequelize.literal(`
            customer_interactions.loan_id NOT IN (
                SELECT payments.loan_id FROM payments WHERE payment_type = "Fully Paid"
            ) 
        `);

        // Apply filtering dynamically
        // if (loan_status) {
        //     whereClause[Op.and] = [
        //         excludedLoanIds,
        //         Sequelize.literal(`loan.loan_status = '${loan_status}'`)  // Dynamic loan status filter
        //     ];
        // } else {
        whereClause[Op.and] = [excludedLoanIds];
        // }

        // Fetch interactions
        const { count, rows: interactions } = await CustomerInteraction.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] }
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
            raw: true,
            nest: true
        });

        if (count === 0) {
            return res.status(200).json({
                status: "Error",
                message: "No data found for the specified criteria."
            });
        }

        return res.status(200).json({
            status: "Success",
            message: "Query successful.",
            totalRecords: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            data: interactions
        });

    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error"
        });
    }
};


module.exports = { addInteraction, getInteractionsByDate ,
                   updateInteraction, getInteractionsByOfficerAndDate,
                   getNotContactedInteractionsByOfficerAndDate
                };