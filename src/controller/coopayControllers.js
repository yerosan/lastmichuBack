const coopayModel=require("../models/coopayForm")

const addCoopay=(req, res)=>{
    const inputData=req.body
    console.log("this is data", inputData)

    try{
        if(!inputData.transaction || !inputData.value ||
             !inputData.agent || !inputData.merchante || 
             !inputData.activeUsers || !inputData.customers){
                res.status(200).json({message:"All field is required"})
        }else{
            coopayModel.create(inputData).then(result=>{
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


const getCoopay=(req, res)=>{
    try{
        coopayModel.findAll().then(result=>{
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

const lastCoopayData=(req,res)=>{
    try{
        coopayModel.findOne({order:[["createdAt","DESC"]]}).then(results=>{
            if(results){
                res.status(200).json({message:"succeed", data:results})
            }
        })
    }catch(error){
        res.status(500).json({message:"An internal error"})
    }
}

module.exports={addCoopay, getCoopay,lastCoopayData}