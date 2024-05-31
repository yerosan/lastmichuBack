const OperationModel = require("../models/operationalModel")
const operationalModel= require ("../models/operationalModel")
const {Op,DATEONLY}= require("sequelize")
const sequelize=require("sequelize")
const userModel=require("../models/userModel")

const addOperationalData= async(req, res)=>{
    const datas=req.body
    if(! datas.customerName || !datas.customerId || !datas.customerPhone || !datas.applicationStatus || !datas.approvalDate ||
       ! datas.userId || !datas.officerName
    ){
        res.status(200).json({message:"All field is required"})
    }else{
        try{
            await operationalModel.sync()
            const checkData= await operationalModel.findOne({where:{customerPhone:datas.customerPhone, userId:datas.userId, approvaldate:datas.approvalDate }})
            if(checkData){
                res.status(200).json({message:'Customer data already exist'})
            }else{
                const registerData= await operationalModel.create(datas)
                if(registerData){
                    res.status(200).json({message:"succeed", data:registerData})
                }else{
                    res.status(200).json({message:"Unable to register data"})
                }
            }
            
        }catch(error){
            console.log("The error", error)
            res.status(500).json({message:"An internal error"})
        }
        
    }
}

const getOperationalData= async(req, res)=>{
    const dateRange=req.body
    try {
        const datas = await operationalModel.findAll({where:{approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        if (datas.length>0){
            res.status(200).json({message:'succeed', data:datas})
        }else{
            res.status(200).json({message:"Unable to get data"})
        }
    }catch(error){
        res.status(500).json({message:"An internal error"})
        console.log("The error", error)
    }

}


const getOperationalDataPerUser=async(req, res)=>{
    const data=req.body
    if(! data.userId){
        res.status(200).json({message:"User is required"})
    }else{
        try{
            const getUserData= await operationalModel.findAll ({where:{userId:data.userId, approvalDate:{[Op.between]:[data.startDate, data.endDate]}}})
            if(getUserData.length>0){
               res.status(200).json({message:"succeed", data:getUserData})
            }else{
                res.status(200).json({message:"Unable to get data"})
            }
        }catch(error){
            console.log("The Error", error)
            res.status(200).json({message:"An internal error"})
        }
    }

}

const getOperationalDataPerUserTotal=async(req, res)=>{
    const data=req.body
    const allUserStatus={}
        try{
            let allUser= await operationalModel.findAll({ where:{approvalDate:{[Op.between]:[data.startDate, data.endDate]}},
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "user"]],
            raw: true 
            })
            if(allUser.length>0){
                await Promise.all(
                allUser.map( async userData=>{
                    let userId=userData.user
                    const getUserData= await operationalModel.findAll ({where:{userId:userId, approvalDate:{[Op.between]:[data.startDate, data.endDate]}},
                        attributes: [
                            [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
                            ],
                            raw:true
                    })
                    let user= await userModel.findOne({where:{userId:userId}})
                    let fullName=user.dataValues.fullName
                    if(getUserData[0].totalSum){
                        allUserStatus[fullName]=getUserData[0].totalSum
                       
                    }
                }))
                
                res.status(200).json({message:"succeed", data:allUserStatus})
            }else{

                res.status(200).json({message:"Data do not found"})
            } 
        }catch(error){
            console.log("The error", error)
            res.status(200).json({message:"An internal error"})
        }
    

}


const OperationalDataPerUser=async(req, res)=>{
    const dateRange=req.body
    const alluserDatas=[]
        try{
            let allUser= await operationalModel.findAll({ where:{approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "user"]],
            raw: true 
            })
            if(allUser.length>0){
                await Promise.all(
                allUser.map( async userData=>{
                    const UserStatus={}
                    let userId=userData.user
                    let allApprovedCustomer=await operationalModel.count({"DISTINCT":"customerPhone", where:{userId:userId, applicationStatus:"approved",approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                    let allCustomer=await operationalModel.count({"DISTINCT":"customerPhone", where:{userId:userId, approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                    
                    const approvedAmountUserData= await operationalModel.findAll({where:{userId:userId, applicationStatus:"approved", approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                        attributes: [
                            [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
                            ],
                            raw:true
                    })
                    let user= await userModel.findOne({where:{userId:userId}})
                    let fullName=user.dataValues.fullName
                    if(approvedAmountUserData[0].totalSum){
                        UserStatus.approvedCustomer=allApprovedCustomer
                        UserStatus.totalApplicant=allCustomer
                        UserStatus.approvedAmount=approvedAmountUserData[0].totalSum
                        UserStatus.officerName=fullName
                        alluserDatas.push(UserStatus)
                    }
                }))
                res.status(200).json({message:"succeed", data:alluserDatas})
            }else{

                res.status(200).json({message:"Data do not found"})
            } 
        }catch(error){
            console.log("The error", error)
            res.status(200).json({message:"An internal error"})
        }
    

}


const getUserLiveData= async(req,res)=>{
    const userid= req.params.userid
    const dates= new Date()
    const month= `0${dates.getMonth()+1}`.slice(-2);
    const year= dates.getFullYear()
    const Day= `0${dates.getDate()}`.slice(-2)
    currentDate=`${year}-${month}-${Day}`
    if(! userid){
        res.status(200).json({message:"User is required"})
    }else{
        try{
            const getUserLiveData= await OperationModel.findAll({where:{userId:userid, approvalDate:currentDate}})
            if(getUserLiveData.length>0){
                res.status(200).json({message:"succeed", data:getUserLiveData})
            }else{
                res.status(200).json({message:"Unable to get data"})
            }
        }catch(error){
            res.status(200).json({message:"An internal error"})
        }
    }
}

const updateOperationalData= async(req, res)=>{
    const data=req.body
    if(! data.operationalId){
        res.status(200).json({message:"Data id is required"})
    }else{
        try{
            const checkData= await operationalModel.findOne({where:{operationalId:data.operationalId}})
            if(checkData){
                let updateData= await OperationModel.update(data,{where:{operationalId:data.operationalId}})
                if(updateData){
                    res.status(200).json({message:"succeed", data:updateData})
                }else{
                    res.status(200).json({message:"Unable to update data"})
                }
            }else{
                    res.status(200).json({message:"Unable to find data to update"})
            }
        }catch(error){
            res.status(500).json({message:"An internal error"})
        }
    }
}

const deleteOperationalData= async(req, res)=>{
    const dataId= req.params.operationalId
    if(! dataId){
        res.status(200).json({message:"Data Id is required"})
    }else{
        try{
            const checkData= await operationalModel.findOne({where: {operationalId:dataId}})
            if(checkData){
                let deleteData= await operationalModel.destroy({where:{operationalId:dataId}})
                if(deleteData){
                    res.status(200).json({message:"succeed", data:deleteData})
                }else{
                    res.status(200).json({message:"Unable to delete data"})
                }
            }else{
                res.status(200).json({message:"Unable to find data to delete"})
            }
        }catch(error){
           res.status(500).json({message:"An internal error"})
           console.log("The error", error)
        }
    }
}

const totalApprovalDashboard= async (req,res)=>{
    const dateRange=req.body
    const currentDate= new Date()
    const month= `0${currentDate.getMonth()+1}`.slice(-2);
    const year= currentDate.getFullYear()
    const Day= `0${currentDate.getDate()}`.slice(-2)
    let today=`${year}-${month}-${Day}`
    try{
        let cardData={}
        let userHistory={}
        let allCustomer=await operationalModel.count({"DISTINCT":"customerPhone", where:{applicationStatus:"approved",approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        let uniqueDay=  await operationalModel.findAll({where:{approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        let totalUniqueDay=  await operationalModel.findAll()
        
        if(dateRange.startDate){
            let totalAmount=await operationalModel.findAll({ where:{approvalDate:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                attributes: [
                [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
                ],
                raw:true
            })
            if(totalAmount[0].totalSum){
                cardData.totalApprovedAmount=totalAmount[0].totalSum
            }else{
                cardData.totalApprovedAmount=0
            }
        }else{
        let totalAmount=await operationalModel.findAll({
            attributes: [
            [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
            ],
            raw:true
        })
        if(totalAmount[0].totalSum){
            cardData.totalApprovedAmount=totalAmount[0].totalSum
        }else{
            cardData.totalApprovedAmount=0
        }
    }
        let weeklytotalAmount=await operationalModel.findAll({ where:{approvalDate:{[Op.between]:[dateRange.weekStart, dateRange.weekEnd]}},
            attributes: [
            [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
            ],
            raw:true
        })

        if(weeklytotalAmount[0].totalSum){
            cardData.weeklyAmount=weeklytotalAmount[0].totalSum
        }else{
            cardData.weeklyAmount=0
        }
        
        let approvalDates= await operationalModel.findAll({ order:[["approvalDate","DESC"]],
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('approvalDate')), "uniqueDate"]],
            raw: true 
            })
        let weeklyCustomer=await operationalModel.count({"DISTINCT":"customerPhone", where:{applicationStatus:"approved",approvalDate:{[Op.between]:[dateRange.weekStart, dateRange.weekEnd]}}})
        if(uniqueDay.length>0){
            let Dates=uniqueDay.map((days)=>(
                days.dataValues.approvalDate
            ))
            let ate=[...new Set(Dates)]
            cardData.workingDay=ate.length
        }else{
            cardData.workingDay=1
        }

        cardData.totalAccounts=allCustomer
        let weeklyDates= await operationalModel.findAll({ where:{approvalDate:{[Op.between]:[dateRange.weekStart, dateRange.weekEnd]}},
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('approvalDate')), "uniqueDate"]],
            raw: true 
            })

        let liveAmount =await operationalModel.findAll({ where:{approvalDate:today},
            attributes: [
            [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
            ],
            raw:true
        })
        
        let liveCustomer=await operationalModel.count({"DISTINCT":"customerPhone", where:{applicationStatus:"approved",approvalDate:today}})
        if(liveAmount[0].totalSum ){
            cardData.liveAmount=liveAmount[0].totalSum
            
        }else{
            cardData.liveAmount=0
        }
        const valuesOnly = approvalDates.map(item => item.uniqueDate);
        const sortedValues = valuesOnly.sort((a, b) => new Date(b)-new Date(a));
        if(today==approvalDates[0].uniqueDate){
            if(approvalDates.length>1){
                let preivDate= approvalDates[1].uniqueDate
                let previousApproval= await operationalModel.findAll({ where:{approvalDate:preivDate},
                    attributes: [
                    [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
                    ],
                    raw:true
                })
                if(previousApproval[0].totalSum){
                    cardData.preivousApproval=previousApproval[0].totalSum
                }else{
                    cardData.preivousApproval=0
                }
    
                if(weeklyDates.length){
                    cardData.weekDates=weeklyDates.length
                }else{
                    cardData.weekDates=1
                }
    
                let previousAccount= await operationalModel.count({ "DISTINCT":"customerPhone", where:{applicationStatus:"approved", approvalDate:preivDate} })
                cardData.preicousAccount=previousAccount
                cardData.weekCustomer=weeklyCustomer
                cardData.liveCustomer=liveCustomer
                res.status(200).json({message:"succeed", data:cardData}) 

            }else{
                
                cardData.preivousApproval=0
    
                if(weeklyDates.length){
                    cardData.weekDates=weeklyDates.length
                }else{
                    cardData.weekDates=1
                }
                cardData.preicousAccount=0
                cardData.weekCustomer=weeklyCustomer
                cardData.liveCustomer=liveCustomer
                res.status(200).json({message:"succeed", data:cardData}) 
            }
           

        }else{
            let preivDate= approvalDates[0].uniqueDate
            let previousApproval= await operationalModel.findAll({ where:{approvalDate:preivDate},
                attributes: [
                [sequelize.fn('SUM', sequelize.col('approvedAmount')), 'totalSum']
                ],
                raw:true
            })

            if(previousApproval[0].totalSum){
                cardData.preivousApproval=previousApproval[0].totalSum
            }else{
                cardData.preivousApproval=0
            }

            if(weeklyDates.length){
                cardData.weekDates=weeklyDates.length
            }else{
                cardData.weekDates=1
            }


            let previousAccount= await operationalModel.count({ "DISTINCT":"customerPhone", where:{applicationStatus:"approved", approvalDate:preivDate} })
            cardData.preicousAccount=previousAccount
            cardData.weekCustomer=weeklyCustomer
            cardData.liveCustomer=liveCustomer
            res.status(200).json({message:"succeed", data:cardData}) 
        }
        

    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }

}

module.exports={addOperationalData, getOperationalData, 
    getOperationalDataPerUser, getUserLiveData,
    updateOperationalData, deleteOperationalData,
    totalApprovalDashboard,getOperationalDataPerUserTotal,
    OperationalDataPerUser
}