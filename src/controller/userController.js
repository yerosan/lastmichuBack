const userModel=require("../models/userModel")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const dotenv=require("dotenv")
const { get } = require("../route/collectionRoute")
const { where } = require("sequelize")
dotenv.config()
function createAccessToken(userName){
    return jwt.sign(userName,process.env.security_key,{expiresIn:"86400s"})
}
const registerUser= async (req,res)=>{
     const userData=req.body
     const password=userData.password
     if(!userData.password || !userData.confirmation || !userData.fullName || !userData.userName || !userData.role){
        res.status(200).json({message:"All field are required"})
     }else{
     try{
        userModel.sync()
        const user= await userModel.findOne({where:{userName:userData.userName}})
        if(user){
            res.status(200).json({message:"User already exist"})
         }
        else{
            let checkPassword= userData.password===userData.confirmation
            if(checkPassword){
            let payload={userName:userData.userName}
            let hashePassword=await bcrypt.hash(password, 10) 
            const createUser=await userModel.create({
                    userName:userData.userName,
                    fullName:userData.fullName,
                    password:hashePassword,
                    })
            if(createUser){
                const token=createAccessToken(payload)
                createUser.dataValues.token=token
                res.status(201).json({message:"succed", data:createUser})
            }else{
                res.status(404).send("Unable to connect to db")
            }
          }else{
            res.status(200).json({message:"Password doesn't much"})
          }
        }
     }catch(error){
        res.status(500).json({message:"An internal error"})
        console.log("An internal error", error)
     }
    }
}
const loginUser=async(req, res)=>{
    const data=req.body
    if (!data.userName || !data.password){
        res.status(200).json({message:"All field are required"})
    }else{
        try{
            const user= await userModel.findOne({where:{userName:data.userName}})
            if(user){
                if(await bcrypt.compare(data.password,user.dataValues.password)){
                    payload={userName:user.dataValues.userName}
                    let token=createAccessToken(payload)
                    user.dataValues.token=token
                    res.status(200).json({message:"succed",data:user})
                }else{
                    res.status(200).json({message:"Incorrect password"})
                }
            }else{
                res.status(200).json({message:"User not found please register"})
            }

        }catch(erro){
            res.status(500).json({message:"An internal error"})
            console.log("An internal error", erro)
        }
    }
}

const addUser = async(req, res)=>{
    const userDatas=req.body
    if (! userDatas.userName || ! userDatas.password || !userDatas.role){
        res.status(400).json({message:"All field is required"})
    }else{
      try{
        const user= await userModel.findOne({where:{userName:userDatas.userName}})
        if(user){
            res.status(403).json({message:"User already exist"})
        }else{
            const hashedPassword = await bcrypt.hash(userDatas.password,10)
            createUser= await userModel.create({userName:userDatas.userName,password:hashedPassword,role:userDatas.role})
            if(createUser){
                res.status(200).json({message:"User created",data:createUser})
            }
        }
      }catch(err){
        console.log("An error",err)
        res.status(200).json({message:"An internal error"})
      }
    }
}

const getUser=async(req, res)=>{
    try{
        let users=await userModel.findAll()
        if(users.length>0){
            res.status(200).json({message:"succeed", data:users})
        }else{
            res.status(200).json({message:"User data not found"})
        }
    }catch(error){
        res.status(500).json({message:"Some thing went wrong"})
        console.log("this is userError", error)
    }
}

const changePassword= async(req, res)=>{
    previData=req.body
    if (!previData.userName|| !previData.oldPassword || !previData.newPassword || !previData.confirmation){
        res.status(200).json({message:"All field is required"})
    }else{
    try{
        await userModel.sync()
        let user= await userModel.findOne({where:{userName:previData.userName}})
        if(user){
            if(await bcrypt.compare(previData.oldPassword,user.dataValues.password)){
               if(previData.newPassword===previData.confirmation){
                  let hasheNewPassword= await bcrypt.hash(previData.newPassword, 10) 
                  let update= await userModel.update({password:hasheNewPassword}, {where:{userId:user.dataValues.userId}})
                  if(update){
                    res.status(200).json({message:"succeed", data:update})
                  }else{
                    res.status(200).json({message:"Unable to change password"})
                  }
               }else{
                res.status(200).json({message:"Make sure your new password match"})
               }
               
            }else{
                res.status(200).json({message:"Old password is incorrect"})
            }
        }else{
            res.status(200).json({message:"Unable to find user"})
        }
    }catch(error){
        console.log("The error", error)
        res.status(200).json({message:"An internal error"})
    }
}
}

module.exports={registerUser,loginUser,changePassword,addUser, getUser}
