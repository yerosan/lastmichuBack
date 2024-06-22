const salseModel=require("../models/salseModel")
const sequelize=require("sequelize")
const userModel=require("../models/userModel")
const {Op}= require("sequelize")
const targetModel=require("../models/targetModel")
const roleModel=require("../models/roleModel")
const districtLists= require("../models/districtListModel")
const moment=require("moment")
const districtModel=require("../models/districtPerUser")
const addSalseData= async(req, res)=>{
   const salseData=req.body
   if (!salseData.userName || !salseData.uniqueCustomer || !salseData.numberOfAccount ||
       !salseData.disbursedAmount || !salseData.income || !salseData.district || !salseData.branchName){
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
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('district')), "uniqueDistrict"]],
            raw: true 
            })
            if(salses.length>0){
                let datas=salses
                let salsess={}
                await Promise.all(
                datas.map(  async districts=>{
                    let districtss=Object.values(districts)[0]
                    let checkDistrict= await  districtLists.findOne({where:{districtName:districtss}})
                    let totalIcome=await salseModel.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}, district:districtss},
                        attributes: [
                        [sequelize.fn("SUM", sequelize.col("income")), "income"],
                        [sequelize.fn("SUM", sequelize.col("disbursedAmount")), "disbursedAmount"],
                        [sequelize.fn("SUM", sequelize.col("uniqueCustomer")), "uniueCustomer"],
                        [sequelize.fn("SUM", sequelize.col("numberOfAccount")), "numberOfAccount"]
                        ],
                    })
                    if(checkDistrict){
                        if(totalIcome[0].income){
                            let districtName=checkDistrict.dataValues.district
                            salsess[districtName]=totalIcome[0]
                        }else{
                            let districtName=checkDistrict.dataValues.district
                            salsess[districtName]=0
                        }
                    }
                }),
               
            )
                res.status(200).json({message:"succeed", data:salsess})
            }else{
                res.status(200).json({message:"Unable to find data"})
            }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const addTarget=async(req, res)=>{
    const targetData=req.body
    if(! targetData.date || !targetData.income || !targetData.numberOfAccount || ! targetData.disbursedAmount 
    || ! targetData.uniqueCustomer || ! targetData.districtName || !targetData.branchName){
        res.status(200).json({message:"All field is required"})
    }else{
        try{
            await targetModel.sync()
            const date= new Date(targetData.date)
            const startyears = new Date(date).getFullYear();
            const startmonth = new Date(date).getMonth();

            const startDates = moment(`${startyears}-${String(startmonth + 1).padStart(2, '0')}-01`, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
            const endDatess = moment(`${startyears}-${String(startmonth + 1).padStart(2, '0')}-01`, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');
            const endDates = moment(endDatess).endOf('month').format('YYYY-MM-DD');
            const checkTarget= await targetModel.findOne({where:{districtName:targetData.districtName,branchName:targetData.branchName, date:{[Op.between]:[startDates, endDates]}}})
            if(checkTarget){
                res.status(200).json({message:"Data already exist"})
            }else{
                const registerTarget= await targetModel.create(targetData)
                if(registerTarget){
                    res.status(200).json({message:"succeed", data:registerTarget})
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

const getTarget = async (req, res)=>{
    const dateVariation= req.body
    try{
        const targets= await targetModel.findAll({where:{date:{[Op.between]:[dateVariation.startDate, dateVariation.endDate]}}})
        if(targets.length>0){
          res.status(200).json({message:"succeed", data:targets})
        }else{
            res.status(200).json({message:"Unable to get target"})
        }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const getTargetPerDate= async(req, res)=>{
    const dateVariation= req.body
    // const startDates = moment(`${startyears}-${String(startmonth + 1).padStart(2, '0')}-01`, 'YYYY-MM-DD').startOf('month').toDate();
    const startyears = new Date(dateVariation.startDate).getFullYear();
    const startmonth = new Date(dateVariation.startDate).getMonth();
    const endyears = new Date(dateVariation.endDate).getFullYear();
    const endmonth = new Date(dateVariation.endDate).getMonth();

    const startDates = moment(`${startyears}-${String(startmonth + 1).padStart(2, '0')}-01`, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
    const endDatess = moment(`${endyears}-${String(endmonth + 1).padStart(2, '0')}-01`, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
    const endDates = moment(endDatess).endOf('month').format('YYYY-MM-DD');
    try{
        await districtLists.sync()
        const listss= await districtLists.findAll()
        let targetSum={}
        if( listss.length>0){
            await Promise.all(
                listss.map( async data=>{
                    let districtStatus={}
                    let districtsss=  data.dataValues.districtName
                    let salseTargetss=await targetModel.findAll({where:{date:{[Op.between]:[startDates,endDates]}, districtName:districtsss},
                        attributes: [
                        [sequelize.fn('SUM', sequelize.col('disbursedAmount')), 'totalDisbursed'],
                        [sequelize.fn("SUM", sequelize.col("uniqueCustomer")), "uniqueCustomer"],
                        [sequelize.fn("SUM", sequelize.col("numberOfAccount")), "numberOfAccount"],
                        [sequelize.fn("SUM", sequelize.col("income")), "income"]
                        ],
                        raw:true
                    })
                    if(salseTargetss[0].totalDisbursed){
                        districtStatus.dataStatus=salseTargetss
                        targetSum[data.dataValues.district]=districtStatus
                    }else{
                        districtStatus.dataStatus=0
                        targetSum[data.dataValues.district]=districtStatus
                    }
                })
            )

                res.status(200).json({message:"succeed", data:targetSum})
            }else{
                res.status(200).json({message:"Unable to get district list"})
            }

    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const getSalesuser=async(req, res)=>{
    try{
        const salesUser= await roleModel.findAll({where:{salesUser:true}})
       
        if(salesUser.length>0){
            let users=salesUser
            await Promise.all(
                users.map( async(user, index)=>{
                    const userss=await userModel.findOne({where:{userId:user.dataValues.userId}})
                    if(userss){
                        users[index].dataValues["userName"]=userss.dataValues.userName
                        users[index].dataValues["fullName"]=userss.dataValues.fullName
                    }
                    // else{
                    //     console.log("this is the Datass", )
                    // }
                })
            )
            res.status(200).json({message:"succeed", data:salesUser})
        }else{
            res.status(200).json({message:"Unable to find users"})
        } 
    }catch(error){
        console.log("The error", error)
        res.status(5000).json({message:"An internal error"})
    }
}

const districtList=async(req, res)=>{
    const districts= req.body
    if(! districts.districtName || ! districts.district){
        res.status(200).json({message:"Name and value are required"})
    }else{
        try{
            await districtLists.sync()
            const checkDistrict=await districtLists.findOne({where:{districtName:districts.districtName}})
            if(checkDistrict){
                res.status(200).json({message:"district found, try to make unique naming"})
            }else{
                const addData= await districtLists.create(districts)
                if(addData){
                    res.status(200).json({message:"succeed", data:addData})
                }else{
                    res.status(200).json({message:"Unable to create list"})
                }
            }
        }catch(error){
          console.log('The error', error)
          res.status(500).json({message:"An internal error"})
        }
    }

}

const getDistrictList= async(req, res)=>{
    try{
        const listOfDistrict= await districtLists.findAll()
            if(listOfDistrict.length>0){
                res.status(200).json({message:"succeed", data:listOfDistrict})
            }else{
                res.status(200).json({message:"Unable to get district list"})
            }
    }catch(error){
        console.log("The error", error)
        res.status(200).json({message:"An internale error"})
    }
}


const createDistrict=async(req, res)=>{
    const data=req.body
    if(!data.userId){
        res.status(200).json({message:"User should be known"})
    }else{
        try{
            await districtModel.sync()
            const checkUser= await districtModel.findOne({where:{userId:data.userId}})
            if(checkUser){
                let updatingDistrict= await districtModel.update(data,{ where:{userId:data.userId}})
                if(updatingDistrict.length>0){
                    res.status(200).json({message:"succeed", data:updatingDistrict})
                }else{
                    res.status(200).json({message:"Unable to update data"})
                }
            }else{
                const createDistircts= await districtModel.create(data)
                if(createDistircts){
                    res.status(200).json({message:"succeed", data:createDistircts})
                }else{
                    res.status(200).json({message:"Unable to assign district"})
                }
            }

        }catch(error){
            console.log("The error", error)
            res.status(500).json({message:"An internal error"})
        }
    }
}

const getDistrictPeruser=async(req, res)=>{
    const userId=req.params.userId
    if(! userId){
        res.status(200).json({message:"User is required"})
    }else{
          try{
            districtModel.sync()
            const findUser= await districtModel.findOne({where:{userId:userId}})
            if(findUser){
                res.status(200).json({message:"succeed", data:findUser})
            }else{
                res.status(200).json({message:"No user"})
            }
          }catch(error){
            console.log("The error", error)
          }
    }
}
module.exports={addSalseData, getSalseData, 
    getSalsePerUser,usersSalse, 
    updateData, deleteData, 
    totalSales, incomePeruser,
    addTarget,getSalesuser,
    createDistrict,getDistrictPeruser,
    getTarget, getTargetPerDate,
    districtList, getDistrictList}
