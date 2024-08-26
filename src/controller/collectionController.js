const CollectionModel = require("../models/collectionModel")
const collectionController=require("../models/collectionModel")
const userModel=require("../models/userModel")
const performanceModel=require("../models/collectionPerformance")
const sequelize=require("sequelize")
const { where,Op } = require("sequelize")
const { raw } = require("body-parser")
const moment = require('moment'); // For date manipulation
const addColletionData=async(req, res)=>{
    const dataSet=req.body

    
    if(!dataSet.userName || 
        !dataSet.customerPhone||
        !dataSet.customerName||
        !dataSet.customerAccount||
        !dataSet.callResponce ||
        !dataSet.date
        ){ 
            res.status(200).json({message:"All field is required"})
        }
    else{
        try{
            let userData= await userModel.findOne({where:{userName:dataSet.userName}})
            if(userData){
                dataSet.userId=userData.dataValues.userId
                await collectionController.sync()
                let todayCollection= await collectionController.findOne({where:{date:dataSet.date, 
                    customerPhone:dataSet.customerPhone, userId:dataSet.userId}})
                if(todayCollection){
                    if(dataSet.callResponce !=="paid" && todayCollection.dataValues.callResponce =="paid"){
                        let updatedPayment=Number(dataSet.payedAmount)
                        dataSet.payedAmount=updatedPayment
                        const addCollection= await collectionController.create(dataSet, {where:{userId:userData.dataValues.userId}})
                        if(addCollection){
                            // let today=dataSet.date
                            await performanceModel.sync()
                            res.status(200).json({message:"succed", data:addCollection})
                        }else{
                            res.status(200).json({message:"unable to add data"})
                        }
                    }else{
                        let updatedPayment= Number(todayCollection.dataValues.payedAmount)+Number(dataSet.payedAmount)
                        dataSet.payedAmount=updatedPayment
                        const addCollection= await collectionController.update(dataSet, {where:{userId:userData.dataValues.userId, collectionId:todayCollection.dataValues.collectionId}})
                        if(addCollection){
                            // let today=dataSet.date
                            await performanceModel.sync()
                             res.status(200).json({message:"succed", data:addCollection})
                        }else{
                            res.status(200).json({message:"unable to add data"})
                        }
                    }

                }else{
                    const addCollection= await collectionController.create(dataSet)
                    let today=dataSet.date
                    const userPerDate= await performanceModel.findOne({where:{userId:userData.dataValues.userId,date:today}})
                    if(addCollection){
                        res.status(200).json({message:"succed", data:addCollection})
                    }else{
                        res.status(200).json({message:"unable to add data"})
                    }
                }
            }else{
                res.status(200).json({message:"user doesn't exist"})
            }
            
        }catch(error){
            console.log("The error", error)
            res.status(500).json({message:"An internal error"})
        }
    }
}

const CollectetionPerUser=async(req, res)=>{
    const userName=req.params.userName
    const currentDate=new Date()
    const currentMonth=currentDate.getMonth()+1
    const currentYear=currentDate.getFullYear()
    const currentDay=currentDate.getDate()
    const month = `0${currentMonth}`.slice(-2);
    const day = `0${currentDay}`.slice(-2);
    const today=`${currentYear}-${month}-${day}`;
    let previousDate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));
    const previousMonth = (currentMonth === 1) ? 12 : currentMonth - 1;
    const previousYear = (currentMonth === 1) ? currentYear - 1 : currentYear;

    const userStatus={}
    const theData=[]
    dateList=[]
    try{
        let user= await userModel.findOne({where:{userName:userName}})
        if(user){
            // await performanceModel.sync()
            await collectionController.sync()
            let liveCollection=await collectionController.findAll({where:{date:today, userId:user.dataValues.userId},
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                ],
                raw:true
                })
            let liveAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:today, callResponce:"paid"}})
            userStatus.liveAccount=liveAccount
            if(liveCollection[0].totalSum){
            userStatus.liveCollection=liveCollection[0].totalSum
            }else{
                userStatus.liveCollection=0
            }

            const topRecentDate = await collectionController.findAll({
                order: [['date', 'DESC']], // Get the most recent date first
                attributes: ['date'] // Only retrieve the date column
            })

            let collectionDate= await collectionController.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('date')), "uniqueDate"]],
                raw: true // Get raw data instead of Sequelize instances
                })
            const valuesOnly = collectionDate.map(item => item.uniqueDate);
            const sortedValues = valuesOnly.sort((a, b) => new Date(b)-new Date(a));
            lastDateData=await collectionController.findAll({order:[["date", "DESC"]]})
            if(lastDateData.length>0){
                if(today==sortedValues[0]){
                    previousDate=sortedValues[1]
                    let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:'paid'}})
                    userStatus.previousAccount=previousAccount
                    if(previousDate){
                        let yesterdayColletion= await collectionController.findAll({where:{date:previousDate, userId:user.dataValues.userId},
                            attributes: [
                                [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                            ],
                            raw:true
                            })
                        if(yesterdayColletion[0].totalSum){
                            userStatus.previousColletion=yesterdayColletion[0].totalSum
                            res.status(200).json({message:"succed", data:userStatus})
                        }else{
                            userStatus.previousColletion=0
                            res.status(200).json({message:"succed", data:userStatus})
                        }
                    }
                    else{
                        userStatus.previousColletion=0
                        res.status(200).json({message:"succed", data:userStatus})
                    }

                }else{
                    previousDate=sortedValues[0]
                    let yesterdayColletion= await collectionController.findAll({where:{date:previousDate, userId:user.dataValues.userId},
                        attributes: [
                            [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                        ],
                        raw:true
                        })
                    let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:"paid"}})
                    userStatus.previousAccount=previousAccount
                    if(yesterdayColletion[0].totalSum){
                        userStatus.previousColletion=yesterdayColletion[0].totalSum
                        res.status(200).json({message:"succed", data:userStatus})
                    }else{
                        userStatus.previousColletion=0
                        res.status(200).json({message:"succed", data:userStatus})
                        
                    }
                }
           }else{
                userStatus.previousColletion=0
                res.status(200).json({message:"succed", data:userStatus})
           }
        }else{
            res.status(200).json({message:"User doesn't exist"})
        }
    }catch(error){
        console.log("this is an error", error)
        res.status(500).json({message:"An internal error"})
    }
}




const totalCollectedPerDateRange=async(req, res)=>{
    const dateRange=req.body
    if(!dateRange.startDate|| !dateRange.endDate){
        res.status(200).json({message:"Date range is required"})
    }

    try{
        // await performanceModel.sync()
        await collectionController.sync()
        let collectionPerDate=await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
            attributes: [
                [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
            ],
            raw:true
            })
        let uniqueCustomers= await collectionController.findAll({where:{callResponce:"paid",date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        let totalAmount=await collectionController.findAll({
            attributes: [
              [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
            ],
            raw:true
          })
        let givenDateTotalAmount=await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
        attributes: [
            [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
        ],
        raw:true
        })
        let collectionDate= await collectionController.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('date')), "uniqueDate"]],
        raw: true // Get raw data instead of Sequelize instances
        })

        let allCustomer=await collectionController.count({"DISTINCT":"customerPhone", where:{callResponce:'paid'}})
        let totalCollectionStat={}
        let totalStatPerUser={}
        if (uniqueCustomers.length>0){

            let collectionUsers= await collectionController.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "uniqueDate"]],
                raw: true // Get raw data instead of Sequelize instances
                })
            const userOnly = collectionUsers.map(item => item.uniqueDate);

            let dateRangeWorkingday= await collectionController.findAll({ where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('date')), "uniqueDate"]],
                raw: true // Get raw data instead of Sequelize instances
                })

            
            totalCollectionStat.workingDay=dateRangeWorkingday.length
            // }

            if(uniqueCustomers.length){
                let customers=uniqueCustomers.map((customer)=>(
                    customer.dataValues.customerPhone
                    
                ))

                totalCollectionStat.totalAccount=customers.length
            }

            await Promise.all(userOnly.map(async Id=>{
                let dateRangeCollectionPerUser=0
                let collectionPeruserID=await collectionController.findAll({where:{userId:Id,date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                    attributes: [
                        [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                    ],
                    raw:true
                    })
                let IdUser= await userModel.findOne({where:{userId:Id}})
                let name=IdUser.dataValues.userName
                if (collectionPeruserID[0].totalSum){
                    dateRangeCollectionPerUser +=collectionPeruserID[0].totalSum
                    totalStatPerUser[`${name}`]=dateRangeCollectionPerUser
                }else{
                    totalStatPerUser[`${name}`]=dateRangeCollectionPerUser
                }
            }))
            totalCollectionStat.dateRangeTotal=collectionPerDate[0].totalSum
            totalCollectionStat.PerUser=totalStatPerUser
            totalCollectionStat.up_to_DateTotalCollection=totalAmount[0].totalSum
            totalCollectionStat.up_to_DateTotalAccount=allCustomer
            totalCollectionStat.up_to_DateWorkingDay=collectionDate.length
            totalCollectionStat.GivenDateAmount=givenDateTotalAmount[0].totalSum
            res.status(200).json({message:"succed", data:totalCollectionStat})
        }
        else{
            res.status(200).json({message:"No collection Data in given date"})
        }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}

const totalCollectedPeruser=async(req,res)=>{
    const userName=req.params.userName
    const currentDate=new Date()
    const currentMonth=currentDate.getMonth()
    const currentYear=currentDate.getFullYear()
    const currentDay=currentDate.getDate()
    const previousMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    const previousYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
    const yesterday = new Date(currentYear, currentMonth, currentDay);
    if(!userName){
        res.send("user required")
    }else{
    try{
        await userModel.sync()
        const userData=await userModel.findOne({where:{userName:userName}})
        const userStatus={}
        if(userData){
            await collectionController.sync()
            const user= await collectionController.findAll({where:{userId:userData.userId}})
            if(user.length>0){
                let totalCollected=0
                let monthlyCollected=0
                let yesterdayCollected=0
                await user.map(amount=>{
                    totalCollected += amount.dataValues.payedAmount
                    let collectedDate=amount.dataValues.date
                    if(previousMonth===collectedDate.getMonth() && previousYear===collectedDate.getFullYear()){
                        monthlyCollected +=amount.dataValues.payedAmount
                        if(yesterday===collectedDate.getDate()){
                            yesterdayCollected +=amount.dataValues.payedAmount
                        }
                    }
                })
                userStatus.fullName=userData.dataValues.fullName
                userStatus.totalCollected=totalCollected
                userStatus.monthlyCollected=monthlyCollected
                userStatus.yesterdayColleted=yesterdayCollected
                res.status(200).json({data:userStatus})
            }else{
                res.status(200).json({message:"No data"})
                }
            }else{
                res.status(200).json({
                    message:"User doesn't exist"
                })
            }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
     }
    }
}

const collectedAmount=async(req,res)=>{
    try{
        const collectionData=await collectionController.findAll()
        const allUser=await collectionController.findAll({attributes:["userId"]})
        const collectionStatus={allUserColletion:0}
        let usersID=[]
        if(allUser.length>0){
            allUser.map(data=>{
                usersID.push(data.dataValues.userId)
            })
        }
        const totalPerformance=await collectionController.findAll()
        let collectedAmounts=0
        if(collectionData.length>0){
            if(usersID.length>0){
              let uniqueUser=new Set(usersID)
              let users=[... uniqueUser]
              await Promise.all( users.map(async userIDs=>{
                let userData= await collectionController.findAll({where :{userId:userIDs},attributes: [
                    [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                ],
                raw:true})
                let totalCollectedPeruser=0
                if(userData[0].totalSum){
                   totalCollectedPeruser +=userData[0].totalSum
                   let userNames=await userModel.findOne({where:{userId:userIDs}})
                   let userName=userNames.dataValues.userName
                   collectionStatus[`${userName}`]=totalCollectedPeruser
                   collectionStatus.allUserColletion +=totalCollectedPeruser
                }
              }))
            
           }
          
            let coll= await collectionController.findAll({attributes: [
                [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
            ],
            raw:true})
            if(coll[0].totalSum){
                collectedAmounts +=coll[0]+totalSum
            }
           collectionStatus.totalCollected=collectedAmounts
           res.status(200).json({message:"succed", data:collectionStatus})
        }else{
            res.status(500).json({message:"No data found"})
        }
    }catch(error){
        res.status(500).json({message:"An internal error"})
    }
}



const deleteUser=async(req, res)=>{
    try{
        let userIDs= await userModel.findAll()
        if(userIDs){
            userIDs.map(user=>{
                let id=user.dataValues.userId
                if(IDs.includes(id)){
                    console.log("ID required", user.dataValues.userName)
                }else{
                    userModel.destroy({where:{userId:id}})
                }
            })
        }
    }catch(error){
        console.log("An error", error)
        res.status(500).send("An error")
    }
}

const totalCustomerPerUser=async(req, res)=>{
    const dateRange=req.body
    const userCollectionData=[]
    try{
        let collectionUsers= await collectionController.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "uniqueDate"]],
            raw: true // Get raw data instead of Sequelize instances
            })
        const userOnly = collectionUsers.map(item => item.uniqueDate);
        if(userOnly.length>0){
            let totalCustomer= [await Promise.all (userOnly.map(async userid=>{
                let user= await userModel.findOne({where:{userId:userid}})
                let userHistory={userName:user.dataValues.userName, fullName:user.dataValues.fullName}
                let userId=userid
                let customerCount=await collectionController.count(
                    {where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]},
                    callResponce:{[Op.in]:["payed","paid"]}}})
                let totalAmount=await collectionController.findAll({where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                    attributes: [
                      [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                    ],
                    raw:true
                  })
                let customertotal=await collectionController.findAll({where:{userId:userId,date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                if(customertotal.length>0){
                    userHistory.totalPaid=customerCount
                    userHistory.totalCustomer=customertotal.length
                    userHistory.totalUnpaid=customertotal.length-customerCount
                    userHistory.totalCollectedAmount=totalAmount[0].totalSum
                }else{
                    userHistory.totalPaid=0
                    userHistory.totalCustomer=0
                    userHistory.totalUnpaid=0
                    userHistory.totalCollectedAmount=0
                }
                userCollectionData.push(userHistory)
            }))]
            res.status(200).json({message:"succeed", data:userCollectionData})
        }else{
            res.status(200).json({message:"No registerd ures"})
        }
    }
    catch(error){
        console.log("The error", error)
        res.status(500).json({message:"An internal error"})
    }
}


const totalcollectionDashboard=async(req, res)=>{
    const dateRange=req.body
    const collectionData=[]
    const userCollectionData=[]
    const currentDate=new Date()
    const currentMonth=currentDate.getMonth()+1
    const currentYear=currentDate.getFullYear()
    const currentDay=currentDate.getDate()
    const month = `0${currentMonth}`.slice(-2);
    const day = `0${currentDay}`.slice(-2);
    const today=`${currentYear}-${month}-${day}`;
    try{
        if (! dateRange.startDate){
            await collectionController.sync()
            await userModel.sync()
             let collectionStart= await collectionController.findOne({order:[["Date","ASC"]]})
             if (collectionStart){
                dateRange.startDate=collectionStart.dataValues.date
                let cardData={}
                let userHistory={}
                let user= await userModel.findAll()
                let allCustomer=await collectionController.count({"DISTINCT":"customerPhone", where:{callResponce:{[Op.in]:["paid","payed"]},date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                let uniqueDay=await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                let totalAmount=await collectionController.findAll({ where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                    attributes: [
                    [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                    ],
                    raw:true
                })

                if(uniqueDay.length>0){
                    let Dates=uniqueDay.map((days)=>(
                        days.dataValues.date
                ))
                    let ate=[...new Set(Dates)]
                    cardData.workingDay=ate.length
                }else{
                    cardData.workingDay=1
                }

                cardData.totalAccounts=allCustomer
                cardData.totalCollecteds=totalAmount[0].totalSum

                let rangedCollection=[cardData]
                
                let collectionDate= await collectionController.findAll({
                    attributes: [[sequelize.fn('DISTINCT', sequelize.col('date')), "uniqueDate"]],
                    raw: true // Get raw data instead of Sequelize instances
                    })
                const valuesOnly = collectionDate.map(item => item.uniqueDate);
                const sortedValues = valuesOnly.sort((a, b) => new Date(b)-new Date(a));
                if(sortedValues.length>0){
                    if(today==sortedValues[0]){
                        previousDate=sortedValues[1]
                        let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:'paid'}})
                        cardData.previousAccount=previousAccount
                        if(previousDate){
                            let yesterdayColletion= await collectionController.findAll({where:{date:previousDate},
                                attributes: [
                                    [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                                ],
                                raw:true
                                })
                            if(yesterdayColletion[0].totalSum){
                                cardData.previousColletion=yesterdayColletion[0].totalSum
    
                            }else{
                                cardData.previousColletion=0
    
                            }
                        }
                        else{
                            cardData.previousColletion=0

                        }
    
                    }else{
                        previousDate=sortedValues[0]
                        let yesterdayColletion= await collectionController.findAll({where:{date:previousDate},
                            attributes: [
                                [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                            ],
                            raw:true
                            })
                        let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:"paid"}})
                        cardData.previousAccount=previousAccount
                        if(yesterdayColletion[0].totalSum){
                            cardData.previousColletion=yesterdayColletion[0].totalSum
                        }else{
                            cardData.previousColletion=0
                            
                        }
                    }
               }else{
                    cardData.previousColletion=0
                    cardData.previousAccount=0
               }

               let liveCollection=await collectionController.findAll({where:{date:today},
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                ],
                raw:true
                })
                let liveAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:today, callResponce:"paid"}})
                cardData.liveAccount=liveAccount
                if(liveCollection[0].totalSum){
                cardData.liveCollection=liveCollection[0].totalSum
                }else{
                    cardData.liveCollection=0
                }




                let collectionUsers= await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                    attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "uniqueDate"]],
                    raw: true // Get raw data instead of Sequelize instances
                    })
                const userOnly = collectionUsers.map(item => item.uniqueDate);


                if(user.length>0){
                    let totalCustomer= [await Promise.all (userOnly.map(async userid=>{
                        let user=await userModel.findOne({where:{userId:userid}})
                        let fullName=user.dataValues.fullName
                        let userId=userid
                        let customerCount=await collectionController.count(
                            {where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]},
                            callResponce:{[Op.in]:["payed","paid"]}}})
                        let totalAmount=await collectionController.findAll({where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                            attributes: [
                            [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                            ],
                            raw:true
                        })
                        let customertotal=await collectionController.findAll({where:{userId:userId,date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                        if(customertotal.length>0){
                            userHistory[fullName]=totalAmount[0].totalSum
                        }else{
                            userHistory[fullName]=0
                        }
                    }))]
                    userCollectionData.push(userHistory)
                    collectionData.push(rangedCollection)
                    collectionData.push(userCollectionData)
                    res.status(200).json({message:"succeed", data:collectionData})
                }else{
                    res.status(200).json({message:"No registerd ures"})
                }
                
             }else{
                res.status(200).json({message:"Unable to get startDate"})
             }
        }else{
            let cardData={}
            let userHistory={}
            let user= await userModel.findAll()
            let lastDateData=await collectionController.findAll({order:[["date", "DESC"]]})
            let allCustomer=await collectionController.count({"DISTINCT":"customerPhone", where:{callResponce:{[Op.in]:["paid","payed"]},date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
            let uniqueDay=await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
            let totalAmount=await collectionController.findAll({ where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                attributes: [
                [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                ],
                raw:true
            })

            if(uniqueDay.length>0){
                let Dates=uniqueDay.map((days)=>(
                    days.dataValues.date
            ))
                let ate=[...new Set(Dates)]
                cardData.workingDay=ate.length
            }else{
                cardData.workingDay=1
            }

            cardData.totalAccounts=allCustomer
            cardData.totalCollecteds=totalAmount[0].totalSum

            let rangedCollection=[cardData]



            let collectionDate= await collectionController.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('date')), "uniqueDate"]],
                raw: true // Get raw data instead of Sequelize instances
                })
            const valuesOnly = collectionDate.map(item => item.uniqueDate);
            const sortedValues = valuesOnly.sort((a, b) => new Date(b)-new Date(a));


            if(sortedValues.length>0){
                if(today==sortedValues[0]){
                    previousDate=sortedValues[1]
                    let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:'paid'}})
                    cardData.previousAccount=previousAccount
                    if(previousDate){
                        let yesterdayColletion= await collectionController.findAll({where:{date:previousDate},
                            attributes: [
                                [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                            ],
                            raw:true
                            })
                        if(yesterdayColletion[0].totalSum){
                            cardData.previousColletion=yesterdayColletion[0].totalSum

                        }else{
                            cardData.previousColletion=0

                        }
                    }
                    else{
                        cardData.previousColletion=0

                    }

                }else{
                    previousDate=sortedValues[0]
                    let yesterdayColletion= await collectionController.findAll({where:{date:previousDate},
                        attributes: [
                            [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                        ],
                        raw:true
                        })
                    let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:"paid"}})
                    cardData.previousAccount=previousAccount
                    if(yesterdayColletion[0].totalSum){
                        cardData.previousColletion=yesterdayColletion[0].totalSum
                    }else{
                        cardData.previousColletion=0
                        
                    }
                }
           }else{
                cardData.previousColletion=0
                cardData.previousAccount=0
           }

           let liveCollection=await collectionController.findAll({where:{date:today},
            attributes: [
                [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
            ],
            raw:true
            })
            let liveAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:today, callResponce:"paid"}})
            cardData.liveAccount=liveAccount
            if(liveCollection[0].totalSum){
            cardData.liveCollection=liveCollection[0].totalSum
            }else{
                cardData.liveCollection=0
            }





            let collectionUsers= await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('userId')), "uniqueDate"]],
                raw: true // Get raw data instead of Sequelize instances
                })
            const userOnly = collectionUsers.map(item => item.uniqueDate);



            if(user.length>0){
                let totalCustomer= [await Promise.all (userOnly.map(async userid=>{
                    let user= await userModel.findOne({where:{userId:userid}})
                    let fullName=user.dataValues.fullName
                    let userId=userid
                    let totalAmount=await collectionController.findAll({where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                        attributes: [
                        [sequelize.fn('SUM', sequelize.col('payedAmount')), 'totalSum']
                        ],
                        raw:true
                    })
                    let customertotal=await collectionController.findAll({where:{userId:userId,date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                    if(customertotal.length>0){
                        userHistory[fullName]=totalAmount[0].totalSum
                    }else{
                        userHistory[fullName]=0
                    }
                    
                }))]
                userCollectionData.push(userHistory)
                collectionData.push(rangedCollection)
                collectionData.push(userCollectionData)
                res.status(200).json({message:"succeed", data:collectionData})
            }else{
                res.status(200).json({message:"No registerd ures"})
            }
       }
    }
    catch(error){
        console.log("the error", error)
        res.status(500).json({message:"An internal error"})
    }
}


const userCollection= async(req, res)=>{
    const dateRange=req.body
    try{
        const allCollection =await collectionController.findAll({where:{date:dateRange.date, userId:dateRange.userId}})
        if(allCollection.length>0){
            await Promise.all(allCollection.map(async collectionData=>{
               let user=await userModel.findOne({where:{userId:collectionData.dataValues.userId}})
               if(user){
                collectionData.dataValues.userName=user.dataValues.userName
                collectionData.dataValues.fullName=user.dataValues.fullName
               }
            }))
          res.status(200).json({message:"succeed", data:allCollection})
        }else{
            res.status(200).json({message:"Data doesn't exist"})
        }
    }catch(error){
     console.log("The error", error)
     res.status(500).json({message:"An internal error"})
    }
}


const userCollectionDetail= async(req, res)=>{
    const dateRange=req.body
    try{
        const allCollection =await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}, userId:dateRange.userId}})
        if(allCollection.length>0){
            await Promise.all(allCollection.map(async collectionData=>{
               let user=await userModel.findOne({where:{userId:collectionData.dataValues.userId}})
               if(user){
                collectionData.dataValues.userName=user.dataValues.userName
                collectionData.dataValues.officerName=user.dataValues.fullName
               }
            }))
          res.status(200).json({message:"succeed", data:allCollection})
        }else{
            res.status(200).json({message:"Data doesn't exist"})
        }
    }catch(error){
     console.log("The error", error)
     res.status(500).json({message:"An internal error"})
    }
}


const allCollection= async(req, res)=>{
    const dateRange=req.body
    try{
        const allCollection =await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        if(allCollection.length>0){
            await Promise.all(allCollection.map(async collectionData=>{
               let user=await userModel.findOne({where:{userId:collectionData.dataValues.userId}})
               if(user){
                collectionData.dataValues.userName=user.dataValues.userName
                collectionData.dataValues.fullName=user.dataValues.fullName
               }
            }))
          res.status(200).json({message:"succeed", data:allCollection})
        }else{
            res.status(200).json({message:"Data doesn't exist"})
        }
    }catch(error){
     console.log("The error", error)
     res.status(500).json({message:"An internal error"})
    }
}

const collectionUpdate=async(req, res)=>{
    const updatingData=req.body
    if(updatingData.collectionId && updatingData.userId){
    try{
        let preivData= await collectionController.findOne({where:{collectionId:updatingData.collectionId, userId: updatingData.userId}})
        if(preivData){
            let updating= await collectionController.update(updatingData,{where:{collectionId:updatingData.collectionId, userId: updatingData.userId}})
            if(updating){
               res.status(200).json({message:"succeed", data:updating})
            }else{
              res.status(200).json({message:"Unable to upate data"})
            }
        }else{
            res.status(200).json({message:"Vailed data is not found"})
        }
    }catch(error){
        console.log("An internal error", error)
        res.status(200).json({message:"An internal error"})
    }
}else{
    res.status(200).json({message:"Missed required data"})
}

}

const deleteCollectionData= async(req, res)=>{
    const userData=req.body
    if(!userData.userId || !userData.collectionId){
        res.status(200).json({message:"Missed required data"})
    }else{
        try{
            let dataDeleting= await collectionController.destroy({where:{userId:userData.userId, collectionId:userData.collectionId}})
            if (dataDeleting){
                res.status(200).json({message:"succeed", data:dataDeleting})
            }else{
                res.status(200).json({message:"Unable to delete data"})
            }
        }catch(error){
            console.log("The error", error)
            res.status(500).json({message:"An internal error"})
        }
    }
}
module.exports={addColletionData,allCollection,userCollection,collectionUpdate,
    deleteCollectionData,totalcollectionDashboard, totalCustomerPerUser,totalCollectedPeruser,
     collectedAmount,CollectetionPerUser,deleteUser, totalCollectedPerDateRange, userCollectionDetail}
