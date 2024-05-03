const salseModel=require("../models/salseModel")
const sequelize=require("sequelize")
const userModel=require("../models/userModel")
const {Op}= require("sequelize")
const addSalseData= async(req, res)=>{
   const salseData=req.body
   if (!salseData.userName || !salseData.uniqueCustomer || !salseData.numberOfAccount ||
       !salseData.disbursedAmount || !salseData.income){
        res.status(200).json({message:"All field is requried"})
       }else{
    try{
        await userModel.sync()
        await salseModel.sync()

        let user = await userModel.findOne({where:{userName:salseData.userName}})
        if(user){
            salseData.userId=user.dataValues.userId
            let addData= await salseModel.create(salseData)
            res.status(200).json({message:"succeed", data:addData})
        }else{
            res.status(200).json({message:"Unable to create data"})
        }

    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}
}

const getSalseData=async(req, res)=>{
    const data=req.body
    try{
        let getData= await salseModel.findAll({where:{date:{[Op.between]:[data.startDate, data.endDate]}}})
        let salseData=[]
        if(getData.length>0){
            await Promise.all (getData.map( async sales=>{
                    let user= await userModel.findOne({where:{userId:sales.dataValues.userId}})
                    if(user){
                        sales.dataValues.userName=user.dataValues.userName
                        sales.dataValues.fullName=user.dataValues.fullName
                        salseData.push(sales)
                    }
                }))
            res.status(200).json({message:"succeed",data:salseData})
        }else{
            res.status(200).json({message:"Data doesn't exist"})
        }
    }catch (error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}


const getSalsePerUser=async(req, res)=>{
    const dateRange=req.body
    try{
        let salsePerusers=[]
        let salses= await salseModel.findAll({ where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "uniqueUser"]],
            raw: true 
            })
        if(salses){
            let data=salses
            await Promise.all(
                data.map(async userids=>{
                    let Id=Object.values(userids)[0]
                    let user= await  userModel.findOne({where:{userId:Id}})
                    let totalSalse=await salseModel.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}, userId:Id},
                        attributes: [
                        [sequelize.fn("SUM", sequelize.col("numberofAccount")), "numberOfAccount"],
                        [sequelize.fn("SUM", sequelize.col("uniqueCustomer")), "uniqueCustomer"],
                        [sequelize.fn("SUM", sequelize.col("disbursedAmount")), "totalDisbursed"],
                        [sequelize.fn("SUM", sequelize.col("income")), "income"],
                        ],
                        raw:true

                    })

                    if(totalSalse[0].numberOfAccount>=0){
                        let userSalse={}
                        userSalse.fullName=user.dataValues.fullName,
                        userSalse.userName=user.dataValues.userName,
                        userSalse.numberOfAccount=totalSalse[0].numberOfAccount
                        userSalse.uniqueCustomer=totalSalse[0].uniqueCustomer
                        userSalse.totalDisbursed=totalSalse[0].totalDisbursed
                        userSalse.income=totalSalse[0].income

                        salsePerusers.push(userSalse)
                    }else{
                        let userSalse={}
                        userSalse.fullName=user.dataValues.fullName;
                        userSalse.userName=user.dataValues.userName;
                        userSalse.numberOfAccount=0;
                        userSalse.uniqueCustomer=0;
                        userSalse.totalDisbursed=0;
                        userSalse.income=0;

                        salsePerusers.push(userSalse)

                    }
                })
            )

            res.status(200).json({message:"succeed", data:salsePerusers})
        }else{
            res.status(200).json({message:"Unable to find Data"})
        }
        
    }catch (error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const usersSalse= async(req, res)=>{
    const data=req.body
    try{
        let userSalses= await salseModel.findAll({where:{userId:data.userId, date:data.date}})
        if(userSalses.length>0){
            res.status(200).json({message:"succeed", data:userSalses})
        }else{
            res.status(200).json({message:"Unable to find data"})
        }
    }catch(error){
        res.status(500).json({message:"An internal error"})
        console.log("The error", error)
    }
}

const updateData=async(req, res)=>{
    const update=req.body
    if (!update.salseId){
        res.status(200).json({message:"Missed required data"})
    }else{
        try{
            let checkData= await salseModel.findOne({where:{salseId:update.salseId}})
            if(checkData){
                let updating= await salseModel.update(update,{where:{salseId:update.salseId}})
                if(updating){
                    res.status(200).json({message:"succeed", data:updating})
                }else{
                    res.status(200).json({message:"Unable to update data"})
                }
            }else{
                res.status(200).json({message:"No data found"})
            }
        }catch(error){
            console.log("The error", error)
            res.status(200).json({message:"An internal error"})

        }

    }
}

const deleteData=async(req, res)=>{
    const data=req.body
    if(!data.salseId || data.useId){
        res.status(200).json({message:"Missed required data"})
    }else{
        try{
            let checkData= await salseModel.findOne({where:{salseId:data.salseId}})
            if(checkData){
                let deleting= await salseModel.destroy({where:{salseId:data.salseId , userId:data.userId}})
                if(deleting){
                    console.log("Deleting", deleting)
                    res.status(200).json({message:"succeed", data:deleting})
                }else{
                    res.status(200).json({message:"Unable to delete data"})
                }
            }else{
              res.status(200).json({message:"Unable to find data"})
            }
        }catch(error){
            console.log("The error", error)
            res.status(500).json({message:"An internal error"})

        }
    }
}


const totalSales=async(req, res)=>{
    const dateRange=req.body
    try{


    let totalSalseStatus=await salseModel.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
        attributes: [
        [sequelize.fn('SUM', sequelize.col('disbursedAmount')), 'totalDisbursed'],
        [sequelize.fn("SUM", sequelize.col("uniqueCustomer")), "uniqueCustomer"],
        [sequelize.fn("SUM", sequelize.col("numberOfAccount")), "numberOfAccount"],
        [sequelize.fn("SUM", sequelize.col("income")), "income"]
        ],
        raw:true
    })


    if (totalSalseStatus){
        let totals=Object.keys(totalSalseStatus[0])
        totals.map(items=>{
               if (totalSalseStatus[0][items]==null){
                totalSalseStatus[0][items]=0
               }
        })
        res.status(200).json({message:"succeed",data:totalSalseStatus[0]})
    }else{
        res.staus(200).json({message:"Unable to get data"})
    }
}catch(error){
    res.status(200).json({message:"An internal error"})
    console.log("The error", error)
}
}

const incomePeruser=async(req, res)=>{
    let dateRange=req.body
    try{
        let salses= await salseModel.findAll({ where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "uniqueUser"]],
            raw: true 
            })

            if(salses){
                let datas=salses
                let salsess={}
                await Promise.all(
                datas.map(  async userId=>{
                    let Id=Object.values(userId)[0]
                    let user= await  userModel.findOne({where:{userId:Id}})
                    let totalIcome=await salseModel.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}, userId:Id},
                        attributes: [
                        [sequelize.fn("SUM", sequelize.col("income")), "income"]
                        ],
                        raw:true
                    })
                    if(user){
                        if(totalIcome[0].income){
                            let fullName=user.dataValues.fullName
                            salsess[fullName]=totalIcome[0].income
                        }else{
                            let fullName=user.dataValues.fullName
                            salsess[fullName]=0
                        }
                    }
                }),
               
            )
                res.status(200).json({message:"succeed", data:salsess})
            }else{
                res.status(200).json({message:"Unable to find users"})
            }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}

module.exports={addSalseData, getSalseData, getSalsePerUser,usersSalse, updateData, deleteData, totalSales, incomePeruser}