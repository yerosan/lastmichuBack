const sequelize=require("sequelize")
const userModel=require("../models/userModel")
const activeOfficerModle=require("../models/index")



const activateOfficer=async(req, res)=>{
    const data=req.body

    console.log("------------The officer active data-------", data)
    if(!data.officerStatus || !data.officerId){
        res.status(200).json({message:"All field is required"})
    }else{
    try{
        let user= await activeOfficerModle.UserInformations.findOne({where:{userId:data.officerId}})
        if(user){
            let officer= await activeOfficerModle.ActiveOfficers.findOne({where:{officerId:data.officerId}})
            if(officer){
                if(officer.officerStatus==data.officerStatus){
                    res.status(200).json({message:"Status already setted"})
                }else{
                    let activate= await activeOfficerModle.ActiveOfficers.update({officerStatus:data.officerStatus}, {where:{officerId:data.officerId}})
                    if(activate){
                        res.status(200).json({message:"succeed", data:activate})
                    }else{
                        res.status(200).json({message:"Unable to change status"})
                    }   
                }
            }else{
                let createaOfficer= await activeOfficerModle.ActiveOfficers.create(data)
                 if(createaOfficer){
                    res.status(200).json({message:"succeed", data:createaOfficer})
                }else{
                    res.status(200).json({message:"Unable to activate officer"})
                }
                
            }
            
        }else{
            res.status(200).json({message:"User doesn't exist"})
        }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}
}


const deactivateOfficer=async(req, res)=>{
    const data=req.body
    if(!data.officerStatus || !data.officerId){
        res.status(200).json({message:"All field is required"})
    }else{
    try{
            let officer= await activeOfficerModle.ActiveOfficers.findOne({where:{officerId:data.officerId}})
            if(officer){
                if(officer.officerStatus=="inactive"){
                    res.status(200).json({message:"Officer already deactivated"})
                }else{
                    let activate= await activeOfficerModle.ActiveOfficers.update({officerStatus:"inactive"}, {where:{officerId:data.officerId}})
                    if(activate){
                        res.status(200).json({message:"succeed", data:activate})
                    }else{
                        res.status(200).json({message:"Unable to deactivate officer"})
                    }
                }
            }else{
                let createaOfficer= await activeOfficerModle.ActiveOfficers.create(data)
                 if(createaOfficer){
                    res.status(200).json({message:"succeed", data:createaOfficer})
                }else{
                    res.status(200).json({message:"Unable to deactivate officer"})
                }

            }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}
}

module.exports={activateOfficer,deactivateOfficer}


