const { query } = require("express");
// const sequelize=require("sequelize")
// const sequelize = require("../db/db");
const complainModel=require("../models/reconciliation")
const userModel=require("../models/userModel")
const moment = require('moment');

const {Op, where}=require("sequelize");
const userInfo = require("../models/userModel");
// const { updateData, updateData } = require("./salseController");

const addComplain=async(req,res)=>{
    const data=req.body
    if(!data.userId || !data.customerAccount || !data.customerPhone || !data.caseType){
        res.status(200).json({message:"All field is required"})
    }else{
        const today = moment().format('YYYY-MM-DD')
        data.transectionDate=today
        try{
            await complainModel.sync()
            const addData=await complainModel.create(data)
            if(addData){
                res.status(200).json({message:"succeed", data:addData})
            }
        }catch(erro){
            console.error("The error", erro)
            res.status(500).json({message:"Something went wrong"})
        }
    }

}

const searchData=async(req, res)=>{
    const search= req.params.search
    if (!search) {
        throw new Error('Search value is required');
      }
    try{
        const searchData= await complainModel.findAll({
            where:{
                [Op.or]: [
                    { customerPhone: { [Op.like]: `%${search}%` } },
                    { customerAccount:{[Op.like]: `%${search}%` } },
                    { caseType:       {[Op.like]: `%${search}%`} },
                ]
            },
            order: [['createdAt', 'DESC']] // Optional: Order by creation date
            
        })

        if(searchData.length>0){
            res.status(200).json({message:"succeed",data:searchData})
        }else{
            res.status(200).json({message:"Unable to find data",})
        }

    }catch(error){
        console.error("The erro", error)
        res.status(500).json({message:"Something went wrong"})
    }
}


const getdateRangeData=async(req,res)=>{
  
    const dateData=req.body
    if (!dateData.startDate || !dateData.endDate || !dateData.userId){
        res.status(200).json({message:"All field is reqquired"})
    }else{
        try{
            const getdatas=  await complainModel.findAll({
                where:{userId:dateData.userId,
                    transectionDate:{[Op.between]:[dateData.startDate, dateData.endDate]}},
                include:[
                    {
                    model: userModel,
                    required: false, // Left join (set to true for inner join)
                    attributes: ['userName', 'fullName'], // Include only the required fields
                    }
            ]
                })
            if(getdatas.length>0){
                res.status(200).json({message:"succeed", data:getdatas})
            }else{
                res.status(200).json({message:"Unable to find data"})
            }
        }catch(error){
            console.error("The error", error)
            res.status(200).json({message:"Something went wrong"})
        }

    }


}

const editComplain=async(req, res)=>{
    const updateData=req.body

    if(!updateData.complainId || ! updateData.userId){
        res.status(200).json({message:"Data should be specified"})
    }else{
        try{
            const checkData= await complainModel.findOne({where:{complainId:updateData.complainId}})
            if(checkData){
                const [updateDatas]=await complainModel.update(updateData, 
                    {where:{complainId:updateData.complainId, userId:updateData.userId}})
                if(updateData===1){
                    res.status(200).json({message:"succed", data:updateDatas})
                }else{
                    res.status(200).json({message:"Unable to update data"})
                }
                
            }else{
                res.status(200).json({message:"Unable to find data"})
            }
        }catch(error){
            console.log("The error", error)
            res.status(200).json({message:"Something went wrong"})
        }
    }
}






module.exports={
    addComplain, searchData,getdateRangeData, editComplain
}