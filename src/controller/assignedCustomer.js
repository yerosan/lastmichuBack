const { query } = require("express");
const assignedCustomer = require("../models/customerAssinged");
const assignedCustomerModel=require("../models/customerAssinged")
// const sequelize=require("sequelize")
const sequelize = require("../db/db");
const { where, Op } = require("sequelize");
const querys=require("../query/collectionQuerys")
const sequeledb=require("../db/db")

const addAssingedCustomer= async(req, res)=>{
    const dataset=req.body
    if(!dataset.userId || !dataset.totalAssignedCustomer){
        res.status(200).json({message:"All field is required"});
    }else{
     try{
        await assignedCustomerModel.sync()
        const checkGivenDateAssigned= await assignedCustomerModel.findOne({where:{userId:dataset.userId,date:dataset.date}})
        if (checkGivenDateAssigned){
            res.status(200).json({message:"Customer is already assinged for this user"})
        }else{
            const assignCustomer=await assignedCustomerModel.create(dataset)
            if(assignedCustomer){
                res.status(200).json({message:"Succeed", data:assignCustomer})
            }else{
                res.status(200).json({message:"Unable to assigned Customer"})
            }
        }
     }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error occured"})
     }
    }
}


const editAssignedCustomer=async(req, res)=>{
    const editedData=req.body
    if(!editedData.assignedId || !editedData.totalAssignedCustomer || !editedData.userId ){
        res.status(200).json({message:"All field is required"})
    }else{
        try{
            const updateData= await assignedCustomerModel.update(editedData,{where:{assignedId:editedData.assignedId}})
            if(updateData){
                res.status(200).json({message:"Succeed", data:updateData})
            }else{
                res.status((200).json({message:"Unable to update data"}))
            }
        }catch(error){
            console.log("The error:",error)
            res.status(500).json({message:"An internal error"})
        }
    }

}

const getAllCollectionUser = async (req, res) => {
    const querys = `
        SELECT roles.userId, 
               user_informations.userName,
               user_informations.fullName
        FROM roles 
        LEFT JOIN user_informations 
        ON roles.userId = user_informations.userId
        WHERE roles.collectionUser = true;
    `;

    try {
        const [collectionUser, metadata] = await sequelize.query(querys); // `sequelize.query` returns `[results, metadata]`
        
        if (collectionUser.length > 0) {
            res.status(200).json({ message: "Succeed", data: collectionUser });
        } else {
            res.status(200).json({ message: "Unable to find data" });
        }
    } catch (error) {
        console.log("The error", error);
        res.status(500).json({ message: "An internal error" });
    }
};

const getAssignedData=async(req, res)=>{
    const dateRange=req.body
    const currentDate=new Date()
    const currentMonth=currentDate.getMonth()+1
    const currentYear=currentDate.getFullYear()
    const currentDay=currentDate.getDate()
    const month = `0${currentMonth}`.slice(-2);
    const day = `0${currentDay}`.slice(-2);
    const today=`${currentYear}-${month}-${day}`;
    // if(!dateRange.startDate|| !dateRange.endDate){
    //     res.status(200).json({message:"Date range is required"})
    // }else{
        try{
            const allAssingedData=await sequeledb.query(querys.assignedQuery,{
                replacements: { startDate: today, endDate: today },
                raw: true
            })

            if(allAssingedData.length>0){
                res.status(200).json({message:"Succeed", data:allAssingedData[0]})
            }else{
                res.status(200).json({message:"Data not exist"})
            }
                
            }catch(error){
                console.log("The error", error)
                res.status(500).json({message:"An internal error"})
            }
    // }
}



module.exports={addAssingedCustomer, editAssignedCustomer,getAllCollectionUser, getAssignedData}
