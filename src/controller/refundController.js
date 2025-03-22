const sequalize=require("../db/db")
const refundController=require("../models/refundModel")
const moment=require("moment")
const complainModel=require("../models/reconciliation")
const userModel=require("../models/userModel")
const {Op, where}=require("sequelize");
const addRefundData=async(req, res)=>{
    const dataset=req.body

    if(!dataset.userId || ! dataset.complainId || !dataset.debitAccount || !dataset.creditAccount ||
        !dataset.amount || !dataset.transectionReference || !dataset.issueDate
    ){
        res.status(200).json({message:"All field is required"})
    }else{
        try{
            await refundController.sync()

            const checkCaseRegistry= await complainModel.findOne({where:{complainId:dataset.complainId , userId:dataset.userId}})
            if(checkCaseRegistry){
                const addData=await refundController.create(dataset)
                if(addData){
                    res.status(200).json({message:"succeed",data:addData} )
                }
            }else{
                res.status(200).json({message:"Register the issue first"})
            }
 
        }catch(error){
            console.error("The error", error)
            res.status(500).json({message:"Something went wrong"})
        }
        
    }
}


const editRefund = async (req, res) => {
    try {
        const updateFields = req.body;

        if (!updateFields.refundId) {
            return res.status(200).json({ message: "Refund ID is required" });
        }

        const [updatedRows] = await refundController.update(updateFields, {
            where: { refundId: updateFields.refundId },
        });
        if (updatedRows === 0) {
            return res.status(200).json({ message: "Refund not found" });
        }

        const updatedRefund = await refundController.findOne({
            where: { refundId: updateFields.refundId },
        });

        return res.status(200).json({ message: "succeed", data: updatedRefund });
    } catch (error) {
        console.error("Error in editRefund:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const refundDataPerUser = async (req, res) => {
    const reqData = req.body;

    if (!reqData.userId || !reqData.startDate || !reqData.endDate) {
        return res.status(200).json({ message: "Required Data is not given" });
    }

    try {
        const getData = await refundController.findAll({
            where: {
                userId: reqData.userId,
                transectionDate: { [Op.between]: [reqData.startDate, reqData.endDate] },
            },
            include: [
                {
                    model: complainModel,
                    required: false, // Left join (set to true for inner join)
                    attributes: ['customerPhone', 'customerAccount'], // Include only the required fields
                },
                {
                    model: userModel,
                    required: false, // Left join (set to true for inner join)
                    attributes: ['userName', 'fullName'], // Include only the required fields
                },
            ],
        });

        if (getData.length > 0) {
            res.status(200).json({ message: "succeed", data: getData });
        } else {
            res.status(200).json({ message: "Data doesn't exist" });
        }
    } catch (error) {
        console.error("The error", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};



const financeDataPerUser = async (req, res) => {
    const reqData = req.body;

    if (!reqData.userId || !reqData.startDate || !reqData.endDate) {
        return res.status(200).json({ message: "Required Data is not given" });
    }

    try {
        const getData = await refundController.findAll({
            where: {
                userId: reqData.userId,
                transectionDate: { [Op.between]: [reqData.startDate, reqData.endDate] },
                transectionType:{[Op.in]:["PL51410","PL65224"]}
            },
            attributes:["customerAccount","transectionType","debitAccount","amount","issueDate"],
            order: [['createdAt', 'DESC']]
        });

        if (getData.length > 0) {
            res.status(200).json({ message: "succeed", data: getData });
        } else {
            res.status(200).json({ message: "Data doesn't exist" });
        }
    } catch (error) {
        console.error("The error", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const financeReport = async (req, res) => {
    const reqData = req.body;

    if (!reqData.startDate || !reqData.endDate) {
        return res.status(200).json({ message: "Required Data is not given" });
    }

    try {
        const getData = await refundController.findAll({
            where: {
                transectionDate: { [Op.between]: [reqData.startDate, reqData.endDate] },
            },
            attributes:["customerAccount","transectionType","debitAccount","amount","issueDate"],
            order: [['createdAt', 'DESC']]
        });

        if (getData.length > 0) {
            res.status(200).json({ message: "succeed", data: getData });
        } else {
            res.status(200).json({ message: "Data doesn't exist" });
        }
    } catch (error) {
        console.error("The error", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};



const getAllData=async(req, res)=>{
    const dateRange=req.body
    try{
        const allData= await refundController.findAll({
            where:{transectionDate:{[Op.between]:[dateRange.startDate,dateRange.endDate]}},
            include: [
                {
                    model: userModel,
                    required: false, // Left join (set to true for inner join)
                    attributes: ['userName', 'fullName'], // Include only the required fields
                },
                {
                    model: complainModel,
                    required: false, // Left join (set to true for inner join)
                    attributes: ['customerPhone', 'customerAccount'], // Include only the required fields
                },
            ]
        })
        if(allData){
            res.status(200).json({message:"succeed", data:allData})
        }else{
            res.status(200).json({message:"Data doesn't found"})
        }
    }catch(error){
        console.error("The error", error)
        res.status(200).json({message:"Something went wrong"})
    }
}


module.exports={
    addRefundData, editRefund, refundDataPerUser, 
    getAllData, financeDataPerUser, financeReport
}