const instituteModel=require("../models/instituteform")

const Sequelize=require("sequelize")

const addInstitute=(req, res)=>{
    const inputData=req.body
    console.log("this is data", inputData)

    try{
        if(!inputData.parteners || !inputData.waterSupply ||
             !inputData.entertainment || !inputData.bill || 
             !inputData.telecom || !inputData.cooperative||
              !inputData.gateWay || !inputData.education || !inputData.transport){
                res.status(200).json({message:"All field is required"})
        }else{
            const total=Number(inputData.waterSupply)+Number(inputData.transport)+Number(inputData.entertainment)+
            Number(inputData.telecom)+Number(inputData.gateWay)+Number(inputData.cooperative)+Number(inputData.bill)+Number(inputData.education)
            console.log("this is total", total)
            inputData.total=total
            instituteModel.create(inputData).then(result=>{
                if(result){
                    res.status(200).json({message:"succeed", data:result})
                }
            })
        }
    }catch(error){
        console.log("an error",error)
        res.status(500).json({message:"An internal error"})
    }
}


const getInstitute=(req, res)=>{
    try{
        instituteModel.findAll().then(result=>{
            if(result.length>0){
                res.status(200).json({data:result})
            }else{
                res.status(404).json({message:"No data found"})
            }
        })
    }catch(error){
        console.log("An error",error)
        res.status(500).json({message:"An internal error"})
    }
}

const lastInstituteData=(req,res)=>{
    try{
        instituteModel.findOne({order:[["createdAt","DESC"]]}).then(results=>{
            if(results){
                res.status(200).json({message:"succeed", data:results})
            }
        })
    }catch(error){
        res.status(500).json({message:"An internal error"})
    }
}

module.exports={addInstitute, getInstitute,lastInstituteData}
