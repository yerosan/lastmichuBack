const { Script } = require("vm");
const predDb=require("../models/predictionInformation")
const { spawn } = require('child_process');
const { STRING } = require("sequelize");
const predictedData=async(req, res)=>{
    const dataSet=req.body
    if(!STRING(dataSet.bloodPressure) || !STRING(dataSet.Albumin) || !String(dataSet.bloodUrea) || !String(dataSet.serumCreatinine)|| !String(dataSet.diabetesMellitus)){
        res.status(400).json({message:"All field is required"})
    }else{
    try{
        const dir="C:/Users/M/Downloads/Telegram Desktop/final project/final project/predict.py"
        const pythonProcess = spawn('python', [dir, JSON.stringify(dataSet)]);
        pythonProcess.stdout.on('data', (data) => {
            let result=data.toString();
            intData=parseInt(result.replace(/\D/g, ''), 10)
            dataSet.predictedValue=intData
            return predDb.create(dataSet).then((created)=>{
                if(created){
                    res.status(200).json({message:"Data is registerd",data:created})
                }
            }).catch(error=>{
                res.status(404).json({message:"db error"})
                console.log("an error", error)
            })

        });
    }catch(erro){
        console.log("an internal error",erro)
        res.status(500).json({message:"An internal error"})
    }
}

}

const getData=async(req,res)=>{
    try{
        const wholeData= await predDb.findAll()
        console.log(wholeData)
        if(wholeData.length>0){
            res.status(200).json({message:"succed",data:wholeData})
        }else{
            res.status(404).json({message:"No data found"})
        }
    }catch(err){
        console.error("an error",err)
        res.status(500).json({message:"An interal error"})
    }
}

const patientStatus= async(req,res)=>{
    try{
        const statusOf_cdk= await predDb.findAll({where:{predictedValue:1}})
        const statusOf_not_cdk=await predDb.findAll({where:{predictedValue:0}})
        if(statusOf_cdk.length>0 || statusOf_not_cdk.length>0){
            static={}
            static.not_cdk=statusOf_cdk.length
            static.cdk=statusOf_not_cdk.length
            if(Object.keys(static).length>0){
                res.status(200).json({message:"succed", statistics:static})
            }else{
                res.status(200).json({message:"computation error"})
            }
        }else{
            res.status(200).json({message:"Unable to calculate statistics"})
        }
    }catch(erro){
        res.status(500).send("An internal error")
    }
}

const patientPer_class=async(req, res)=>{
    const target=req.params.target
    console.log("params",target)
    return predDb.findAll({where:{predictedValue:target}}).then(statu=>{
        if(statu.length>0){
            res.status(200).json({message:"succed", data:statu})
        }else{
            res.status(403).json({message:"No data found with given target "})
        }
    }).catch(error=>{
        console.error("An error", error)
        res.status(500).json({message:"An internal error"})
    })
}

module.exports={predictedData,getData,patientStatus,patientPer_class}