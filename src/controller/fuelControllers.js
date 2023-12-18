const fuelModel=require("../models/FuelForm")


const addfuel=(req, res)=>{
    const inputData=req.body
    console.log("this is input data", inputData)

    try{
        if(! inputData.fuel || !inputData.gasStation || !inputData.tnx || !inputData.amount){
            res.status(200).json({message:"All field is required"})

        }else{
            fuelModel.create(inputData).then(result=>{
                if(result){
                    res.status(200).json({message:"succeed", data:result})
                }
            })
        }
    }catch(error){
        console.log("an error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const getFuel=(req,res)=>{
    try{
        fuelModel.findAll().then(results=>{
            if(results.length>0){
                 res.status(200).json({message:"succeed",data:results})
            }else{
                res.status(404).json({message:"No data found"})
            }
        })
    }catch(error){
        console.log("an error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const latestFuel=(req, res)=>{
    try{
        fuelModel.findOne({order:[["createdAt", "DESC"]]}).then(resultss=>{
            if(resultss){
                res.status(200).json({message:"succeed", data:resultss})
            }else{
                res.status(404).json({message:"No data found"})
            }
        })
    }catch(error){
        console.log("an error", error)
        res.status(500).json({message:"An internal error"})
    }
}


module.exports={addfuel, getFuel, latestFuel}