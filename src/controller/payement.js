const Payment = require("../models/payments");
const { DueLoanData, ActiveOfficers, UserInformations } = require("../models");
const CollectionModel=require("../models/collectionModel")
const sequelize = require("../db/db"); // Import your Sequelize instance
const { Op, where } = require("sequelize");
const { search } = require("../route/payment");

const addPayment = async (req, res) => {
    const transaction = await sequelize.transaction(); // Start a transaction
    try {
        const dataSet=req.body
        if(!dataSet.officer_id || 
            !dataSet.phone_number ||
            !dataSet.loan_id ||
            !dataSet.payment_type ||
            !dataSet.payment_amount ||
            !dataSet.payment_date
            ){ 
               return res.status(200).json({
                    status:"Erro",
                    message:"All field is required"})
            }

            let paymentExistance = await Payment.findOne({
                where: {
                    loan_id: dataSet.loan_id,
                    payment_type: {
                        [Op.or]: ["fully paid", "Fully Paid"]
                    }
                }
            });
            

        if(paymentExistance){
                    return res.status(200).json({
                        status:"Error",
                        message:"This loan is already paid"
                  })

                }else{
                            // 1. Insert into `payment` table
                const newPayment = await Payment.create({
                    phone_number:dataSet.phone_number,
                    loan_id:dataSet.loan_id,
                    payment_type:dataSet.payment_type,
                    payment_amount:dataSet.payment_amount,
                    remaining_balance:dataSet.remaining_balance || 0,
                    payment_date:dataSet.payment_date,
                    officer_id:dataSet.officer_id
                }, { transaction });


                // ✅ Insert into `collection_data` using the same `interaction_id`
                const newCollectionData = await CollectionModel.create({
                    userId: dataSet.officer_id, 
                    customerName: dataSet.customer_name || "Unknown", // Default if not provided
                    customerPhone: dataSet.phone_number,
                    customerAccount: dataSet.saving_account || dataSet.loan_id, // Linking loan_id as customerAccount
                    payedAmount:dataSet.payment_amount,
                    callResponce: "paid",
                    productType: dataSet.productType || "loandId", // Optional field
                    paymentStatus:dataSet.payment_type,
                    collectionId: newPayment.payment_id, // Linking with interaction_id from the previous insert,
                    date:dataSet.payment_date
                }, { transaction });


                // Commit transaction if both operations are successful
                await transaction.commit();

                // Send the response back with success message
                return res.status(200).json({
                    status:"Success",
                    message: "Payment recorded successfully",
                    data:{
                        payment: newPayment,
                        collectionData: newCollectionData
                        }
                    
                });
        }

    } catch (error) {
        // Rollback transaction in case of any error
        console.error("Error adding payment:", error);
        await transaction.rollback();
        res.status(500).json({ 
            status:"Error",
            message: "Internal server error" });
    }
};




const updatePayment = async (req, res) => {
    const transaction = await sequelize.transaction(); // Start a transaction

    try {
        const dataSet = req.body;

        // Validate required fields
        if (!dataSet.payment_id ||
            !dataSet.officer_id ||
            !dataSet.phone_number ||
            !dataSet.loan_id ||
            !dataSet.payment_type ||
            !dataSet.payment_amount ||
            !dataSet.payment_date) {
            return res.status(200).json({ 
                status:"Error",
                message: "All fields are required." });
        }

        // 1. Update the `payment` table
        const updatedPayment = await Payment.update({
            phone_number: dataSet.phone_number,
            loan_id: dataSet.loan_id,
            payment_type: dataSet.payment_type,
            payment_amount: dataSet.payment_amount,
            remaining_balance: dataSet.remaining_balance || 0,
            payment_date: dataSet.payment_date,
            officer_id: dataSet.officer_id
        }, {
            where: { payment_id: dataSet.payment_id },
            transaction
        });

        if (updatedPayment[0] === 0) { // If no rows were updated
            return res.status(200).json({message:"Payment record not found."});
        }

        // 2. Update the `collection_data` table based on `payment_id`
        const updatedCollectionData = await CollectionModel.update({
            userId: dataSet.officer_id,
            customerName: dataSet.customer_name || "Unknown",
            customerPhone: dataSet.phone_number,
            customerAccount: dataSet.saving_account || dataSet.loan_id, // Linking loan_id as customerAccount
            payedAmount: dataSet.payment_amount,
            callResponce: "paid",
            productType: dataSet.productType || "loanId",
            paymentStatus: dataSet.payment_type,
            collectionId: dataSet.payment_id, // Using payment_id as the collectionId
            date: dataSet.payment_date
        }, {
            where: { collectionId: dataSet.payment_id },
            transaction
        });

        if (updatedCollectionData[0] === 0) { // If no rows were updated
           return res.status(200).json({
                status:"Error",
                message:"Collection data record not found."});
        }

        // Commit transaction if both updates are successful
        await transaction.commit();

        // Send the response back with success message
        return  res.status(200).json({
            status:"Success",
            message: "Payment updated successfully",
            data:{
                payment: updatedPayment,
                collectionData: updatedCollectionData
            }
            
        });

    } catch (error) {
        // Rollback transaction in case of any error
        await transaction.rollback();
        console.error("Error updating payment:", error);
        res.status(500).json({
             status:"Error",
             message: "Internal server error" 
            });
    }
};


// ✅ Get Payments by Date
const getPaymentsByDate = async (req, res) => {
    try {
        const { payment_date, page = 1, limit = 10 } = req.body; // Pagination defaults

        if (!payment_date) {
            return res.status(200).json({ 
                status:"Error",
                message: "Payment date is required." });
        }

        const offset = (page - 1) * limit;

        const { count, rows: payments } = await Payment.findAndCountAll({
            where: { payment_date },
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    attributes: { exclude: ["createdAt", "updatedAt"] }
                }
            ],
            order: [["created_at", "DESC"]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        if (count === 0) {
            return res.status(200).json({
                status:"Error",
                message: "No payments found for the specified date." });
        }

        return res.status(200).json({
            status:"Success",
            message: "Success",
            totalRecords: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            data: payments
        });

    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ 
            status:"Error",
            message: "Internal server error" });
    }
};

// ✅ Get Payments by Officer and Date
const gettodaysPaymentsByOfficer = async (req, res) => {  
    try {
        const { officer_id, page = 1, limit = 10 , search} = req.body; // Pagination defaults
        if (!officer_id) {
            return res.status(200).json({ 
                status:"Error",
                message: "Officer ID and Payment Date are required." });
        }

        const offset = (page - 1) * limit;

        const payment_date = new Date().toISOString().split('T')[0];
        console.log("------------------Date-=============---------", payment_date)

        const { count, rows: payments } = await Payment.findAndCountAll({
            where: { payment_date:payment_date,  ...(search && { phone_number: search}),},
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    // attributes: ["loan_id", "amount", "due_date"]
                },
                {
                    model: ActiveOfficers,
                    as: "officer",
                    where: { officerId: officer_id }, // Filter by officer ID
                    attributes: ["officerId"],
                    required: true, // Ensures INNER JOIN
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
            order: [["created_at", "DESC"]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        if (count === 0) {
            return res.status(200).json({ 
                status:"Error",
                message: "No payments found for the specified officer and date." });
        }

        return res.status(200).json({
            status:"Success",
            message: "Success",
            totalRecords: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            data: payments
        });

    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ 
            status:"Error",
            message: "Internal server error" });
    }
};




// ✅ Get Payments by Officer and Date
const getPaymentsByOfficerAndDate = async (req, res) => {  
    try {
        const { officer_id, payment_date, page = 1, limit = 10 , search} = req.body; // Pagination defaults
        if (!officer_id || !payment_date) {
            return res.status(200).json({ 
                status:"Error",
                message: "Officer ID and Payment Date are required." });
        }

        const offset = (page - 1) * limit;

        const { count, rows: payments } = await Payment.findAndCountAll({
            where: { payment_date:{[Op.between]:[payment_date.startDate, payment_date.endDate]
              
             },  ...(search && { phone_number: search}),},
            include: [
                {
                    model: DueLoanData,
                    as: "loan",
                    // attributes: ["loan_id", "amount", "due_date"]
                },
                {
                    model: ActiveOfficers,
                    as: "officer",
                    where: { officerId: officer_id }, // Filter by officer ID
                    attributes: ["officerId"],
                    required: true, // Ensures INNER JOIN
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
            order: [["created_at", "DESC"]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        if (count === 0) {
            return res.status(200).json({ 
                status:"Error",
                message: "No payments found for the specified officer and date." });
        }

        return res.status(200).json({
            status:"Success",
            message: "Success",
            totalRecords: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            data: payments
        });

    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ 
            status:"Error",
            message: "Internal server error" });
    }
};

module.exports = { addPayment, getPaymentsByDate,
                    getPaymentsByOfficerAndDate, updatePayment,
                    gettodaysPaymentsByOfficer};
