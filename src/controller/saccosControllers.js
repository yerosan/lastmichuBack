const saccosDb=require("../models/saccoForm")

const saccosData=(req, res)=>{
    const inputData=req.body

    console.log("this is dataset", inputData)

    try{
        if(!inputData.saccos || !inputData.saccosUnion || !inputData.mpcus){
            res.status(200).json({message:"All field is required"})
        }else{
            const total= Number(inputData.saccos)+Number(inputData.saccosUnion) + Number(inputData.mpcus);
            inputData.total=total;
            saccosDb.create(inputData).then(created=>{
                if(created){
                    res.status(200).json({messaga:"data is registured", data:created})
                }
            })
        }
    }catch(error){
        console.log("this is an error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const getSaccos=(req,res)=>{
    try{
        saccosDb.findAll().then(ress =>{
            if (ress.length>0){
                res.status(200).json({message:ress })
            }else{
                res.status(404).json({message:"No data found"})
            }
        })
    }catch(eror){
        console.log("this is saccosget error", eror)
        res.status(500).json({message:"An internal error"})
    }
}


const latestSaccos=(req, res)=>{
    try{
        saccosDb.findOne({order:[["createdAt", "DESC"]]}).then(resualt=>{
            if(resualt){
                console.log("this is a resualt", resualt)
                res.status(200).json({data:resualt})
            }
        })
    }catch(error){
         res.status(500).json({message:"An internal error"})
    }
}

module.exports={saccosData, getSaccos,latestSaccos}