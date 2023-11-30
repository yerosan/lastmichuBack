const userModel=require("../models/userModel")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const dotenv=require("dotenv")
const userInfo = require("../models/userModel")
dotenv.config()
function createAccessToken(userName){
    console.log("this is secrity of controller", process.env.security_key)
    return jwt.sign(userName,process.env.security_key,{expiresIn:"86400s"})
}
const registerUser= async (req,res)=>{
     console.log("this is path",req.path)
     const userData=req.body
     console.log("this is path",req.body)
     const password=userData.password
     if(!userData.password || !userData.userName || !userData.role){
        res.status(400).json({message:"All field is required"})
     }else{
     try{
        const user= await userModel.findOne({where:{userName:userData.userName}})
        if(user){
            res.status(200).json({message:"User already exist"})
         }
        else{
            let payload={userName:userData.userName}
            let hashePassword=await bcrypt.hash(password, 10) 
            const createUser=await userModel.create({userName:userData.userName,password:hashePassword,role:"admin"})
            if(createUser){
                const token=createAccessToken(payload)
                createUser.dataValues.token=token
                res.status(201).json({message:"User registered successfully", data:createUser})
            }else{
                res.status(404).send("Unable to connect to db")
            }
        }
     }catch(error){
        res.status(500).json({message:"An internal error"})
        console.log("An internal error", error)
     }
    }
}
// { userName: '0912121220', password: 'jal!22' }
const loginUser=async(req, res)=>{
    const data=req.body
    console.log(data, "this is data")
    if (!data.userName || !data.password){
        res.status(400).json({message:"All field is required"})
    }else{
        try{
            const user= await userModel.findOne({where:{userName:data.userName}})
            console.log("this is info", user)
            if(user){
                if(await bcrypt.compare(data.password,user.dataValues.password)){
                    payload={userName:user.dataValues.userName}
                    let token=createAccessToken(payload)
                    user.dataValues.token=token
                    res.status(200).json({message:"succed",data:user})
                }else{
                    res.status(401).json({message:"Incorrect password"})
                }
            }else{
                res.status(403).json({message:"User not found please register"})
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
      }
    }
}

module.exports={registerUser,loginUser,addUser}
