const { where } = require("sequelize")
const roleModel=require("../models/roleModel")
const userModel=require("../models/userModel")
const officerMode=require("../models/activeOfficer")

const addRole=async(req,res)=>{
    const roleData=req.body

        if(roleData.userName){
           try{
            roleModel.sync()
            let user= await userModel.findOne({where:{userName:roleData.userName}})
             if(user){
                let checkUser= await roleModel.findOne({where:{userId:user.dataValues.userId}})
                if(!checkUser){
                    roleData.userId=user.dataValues.userId
                   let creatingRole=await roleModel.create(roleData)
                   res.status(200).json({message:"succed", data:creatingRole})
                }else{
                    res.status(200).json({message:"User already exist"})
                }
             }else{
                res.status(200).json({message:"User doesn't exist"})
             }
           }catch(error){
            console.log("an error", error)
            res.status(500).json({message:"An internal error"})
           }
        }else{
            res.status(200).json({message:'User Name required'})
        }

}

const updateRole=async(req, res)=>{
    const updateData=req.body
    try{
        if(updateData.userId){
            let roleUpdate= await roleModel.update(updateData,{where:{userId:updateData.userId}})
            if(roleUpdate[0]==1){
                res.status(200).json({message:"succeed", data:roleUpdate})
            }
                
            
        }else{
            res.status(200).json({message:'Unable to find uerId'})
        }
    }catch(error){
        res.status(500).json({message:"An internal error"})
        console.log("The Error", error)
    }
    

}

const rolePerUser=async(req,res)=>{
    const userName= req.params.userName
    try{
        let user= await userModel.findOne({where:{userName:userName}})
        if(user){
            let userRole=await roleModel.findOne({where:{userId:user.dataValues.userId}})
            if (userRole){
                userRole.dataValues.userName=userName
                res.status(200).json({message:"succeed", data:userRole})
            }else{
                res.status(200).json({message:"Unable to access role history"})
            }
        }else{
            res.status(200).json({message:"User doesn't exist"})
        }
    }catch(er){
        res.status(500).json({message:"An internal error"})
        console.log("An error", er)
    }
}


const collectionRole=async(req, res)=>{
    try{
        let allCollectionUser= await roleModel.findAll({where:{collectionUser:1},
            attributes: ['userId']
        })
        if(allCollectionUser.length>0){
            await Promise.all(allCollectionUser.map(async collectionData=>{
                let user=await userModel.findOne({where:{userId:collectionData.dataValues.userId}})
                let activeOfficer=await officerMode.findOne({where:{officerId:collectionData.dataValues.userId}})
                if(user){
                    collectionData.dataValues.userName=user.dataValues.userName
                    collectionData.dataValues.fullName=user.dataValues.fullName
                    if(activeOfficer){
                        collectionData.dataValues.officerStatus=activeOfficer.dataValues.officerStatus
                    }else{
                        collectionData.dataValues.officerStatus="inactive"
                    }
                }
            }))
            res.status(200).json({message:"succeed", data:allCollectionUser})
        }else{
            res.status(200).json({message:"Data doesn't exist"})
        }
    }catch(error){
        res.status(500).json({message:"An internal error"})
        console.log("An error", error)
    }
}


module.exports={addRole, updateRole, rolePerUser, collectionRole}