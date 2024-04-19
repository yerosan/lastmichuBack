const CollectionModel = require("../models/CollectionModel")
const collectionController=require("../models/CollectionModel")
const userModel=require("../models/userModel")
const performanceModel=require("../models/collectionPerformance")
const sequelize=require("sequelize")
const { where,Op } = require("sequelize")
const { raw } = require("body-parser")

const addColletionData=async(req, res)=>{
    const dataSet=req.body
    console.log("this is FormData----------------",dataSet)
    if(!dataSet.userName || 
        !dataSet.customerPhone||
        !dataSet.callResponce
        ){ 
            res.status(200).json({message:"All field is required"})
        }
    else{
        try{
            let userData= await userModel.findOne({where:{userName:dataSet.userName}})
            if(userData){
                dataSet.userId=userData.dataValues.userId
                collectionController.sync()
                const addCollection= await collectionController.create(dataSet)
                let today=addCollection.dataValues.date
                performanceModel.sync()
                const userPerDate= await performanceModel.findOne({where:{userId:userData.dataValues.userId,date:today}})
                if(addCollection){
                    if(addCollection.dataValues.payedAmount >0){
                       if(userPerDate){
                        let collectedAmounts=userPerDate.dataValues.collectedAmount+addCollection.dataValues.payedAmount
                        await performanceModel.update({collectedAmount:collectedAmounts},{where:{userId:userPerDate.dataValues.userId,date:today}})
                        res.status(200).json({message:"succed", data:addCollection})
                       }
                       else{
                        let todayData={userId:userData.dataValues.userId,
                            collectedAmount:addCollection.dataValues.payedAmount,
                            date:addCollection.dataValues.date
                        }
                        await performanceModel.create(todayData)
                        res.status(200).json({message:"succed", data:addCollection})
                       }
                    }else{
                        res.status(200).json({message:"succed", data:addCollection})
                        console.log("Data with un paid===============", addCollection)
                    }
                }else{
                    res.status(200).json({message:"unable to add data"})
                }
            }else{
                res.status(200).json({message:"user doesn't exist"})
                console.log("user doesn't exist")
            }
            
        }catch(error){
            res.status(500).json({message:"An internal error"})
            console.log("the error", error)
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

    const userStatus={monthlyCollection:0}
    const theData=[]
    dateList=[]
    try{
        let user= await userModel.findOne({where:{userName:userName}})
        if(user){
            let liveCollection= await performanceModel.findOne({where:{userId:user.dataValues.userId, date:today}})
            let liveAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:today, callResponce:{[Op.in]:['paid', "payed"]}}})
            userStatus.liveAccount=liveAccount
            if(liveCollection){
            userStatus.liveCollection=liveCollection.dataValues.collectedAmount
            // userStatus.liveAccount=liveAccount
            // console.log("<<<<<<<<<<<Live>>>>>>>>", liveAccount, liveCollection)
            }else{
                console.log("No live record")
                userStatus.liveCollection=0
                // userStatus.liveAccount=0
            }
            const perviousData=await performanceModel.findAll({where:{userId:user.dataValues.userId}})
            // console.log("this is a data", perviousData)
            if(perviousData.length>0){
                perviousData.map((data)=>{
                    let day=new Date(data.dataValues.date)
                    // console.log("this is the month", day.getMonth(), previousMonth)
                    if (day.getMonth()+1==previousMonth && day.getFullYear()==previousYear){
                      theData.push(day)
                      userStatus.monthlyCollection +=data.collectedAmount
                    }
                    
                    // console.log("this is pervious Date", previousDate)
                })
                // console.log("this is performancePerviousMonth", userStatus,theData)
            }
            lastDateData=await performanceModel.findAll({order:[["date", "DESC"]]})
            if(lastDateData.length>0){
                lastDateData.map(data=>{
                    let dates= data.dataValues.date
                    if (dateList.includes(dates)){
                        // console.log("the date already exist", dateList)
                    }else{
                    dateList.push(dates)
                    }
                })
                const uniqueDate=new Set(dateList)
                // console.log("----------------------this is theDataSet of UniqueDate----------------", uniqueDate)
                if(today==[...uniqueDate][0]){
                    previousDate=[...uniqueDate][1]
                    // console.log("----------------------==========this is theDataSet of UniqueDate----------------", uniqueDate)
                    let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:{[Op.in]:['paid', "payed"]}}})
                    userStatus.previousAccount=previousAccount
                    if(previousDate){
                        let yesterdayColletion= await performanceModel.findOne({where:{userId:user.dataValues.userId, date:previousDate}})
                        if(yesterdayColletion){
                            userStatus.previousColletion=yesterdayColletion.dataValues.collectedAmount
                            // console.log("################################## ======''''''''''''''''=====````````````````PreviousCollection}}}}}}}}}}}}}}}]``````````````````",userStatus)
                            res.status(200).json({message:"succed", data:userStatus})
                        }else{
                            userStatus.previousColletion=0
                            // console.log("################################## ======''''''''''''''''=====````````````````PreviousCollection}}}}}}}}}}}}}}}]``````````````````",userStatus)
                            res.status(200).json({message:"succed", data:userStatus})
                        }
                    }
                    else{
                        userStatus.previousColletion=0
                        // console.log("################################## ======''''''''''''''''=====````````````````PreviousCollection}}}}}}}}}}}}}}}]``````````````````",userStatus)
                        res.status(200).json({message:"succed", data:userStatus})
                    }

                }else{
                    previousDate=[...uniqueDate][0]
                    // console.log("----------------------;;;;;;;;;;;;;;this is theDataSet of UniqueDate----------------", uniqueDate)
                    let yesterdayColletion= await performanceModel.findOne({where:{userId:user.dataValues.userId,date:previousDate}})
                    let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:previousDate, callResponce:{[Op.in]:['paid', "payed"]}}})
                    userStatus.previousAccount=previousAccount
                    if(yesterdayColletion){
                        userStatus.previousColletion=yesterdayColletion.dataValues.collectedAmount
                        // console.log("################################## ======''''''''''''''''=====````````````````PreviousCollection}}}}}}}}}}}}}}}]``````````````````",userStatus)
                        res.status(200).json({message:"succed", data:userStatus})
                    }else{
                        userStatus.previousColletion=0
                        res.status(200).json({message:"succed", data:userStatus})
                        // console.log("################################## ======''''''''''''''''=====````````````````PreviousCollection}}}}}}}}}}}}}}}]``````````````````",userStatus)
                        
                    }
                }
           }else{
                userStatus.previousColletion=0
                res.status(200).json({message:"succed", data:userStatus})
                // console.log("################################## ======''''''''''''''''=====````````````````PreviousCollection}}}}}}}}}}}}}}}]``````````````````",userStatus)
           }
        }else{
            console.log("user doesn't exist")
            res.status(200).json({message:"User doesn't exist"})
        }
    }catch(error){
        console.log("this is an error", error)
        res.status(500).json({message:"An internal error"})
    }
}




const totalCollectedPerDateRange=async(req, res)=>{
    const dateRange=req.body
    console.log("The date range >>>>>>>>>>>>>>>>", dateRange)
    if(!dateRange.startDate|| !dateRange.endDate){
        res.status(200).json({message:"Date range is required"})
    }

    try{
        let collectionPerDate=await performanceModel.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        let uniqueCustomers= await collectionController.findAll({where:{callResponce:{[Op.in]:["paid","payed"]},date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        let uniqueDate=await collectionController.count({distinct:"date",where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        let uniqueDay=await collectionController.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
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

        let allCustomer=await collectionController.count({"DISTINCT":"customerPhone", where:{callResponce:{[Op.in]:['paid', "payed"]}}})
        let previousAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:"2024-04-15", callResponce:{[Op.in]:['paid', "payed"]}}})
        let liveAccount= await collectionController.count({"DISTINCT":"customerPhone", where:{date:"2024-04-16", callResponce:{[Op.in]:['paid', "payed"]}}})

        // YourModel.findAll({
        //     attributes: [[sequelize.fn('DISTINCT', sequelize.col('columnName')), 'uniqueValues']],
        //     raw: true // Get raw data instead of Sequelize instances
        //   })
        let weeklyCollected={}
        let weeklytotal=0
        let weeklyPerUser={}
        let userss=[]
        if (collectionPerDate.length>0){
            // console.log("===========````````````````Unique Date Count``````````````````=================",uniqueDate, "IN", "---------DateRange--------", dateRange)
            // console.log("===========````````````````Unique Date``````````````````=================",uniqueDay, "IN", "---------DateRange--------", dateRange)
            // console.log("===========````````````````TotalCollected Amount``````````````````=================",totalAmount, "IN", "---------Untill today--------")
            // console.log("===========````````````````GivenDateTotalAmount``````````````````=================",givenDateTotalAmount, "IN", "---------Untill today--------")
            // console.log(";;;;;;;The unique collectionDate;;;;;;;;;;;;;",collectionDate,"''''''''''''", collectionDate.length)
            // console.log(";;;;;;;all customer;;;;;;;;;;;;;",allCustomer,"''''''''''''")
            // console.log(";;;;;;;PreviousCollection;;;;;;;;;;;;;",previousAccount,"''''''''''''")
            // console.log(";;;;;;;PreviousCollection;;;;;;;;;;;;;",liveAccount,"''''''''''''")

             collectionPerDate.map(collection=>{
                weeklytotal +=collection.dataValues.collectedAmount
                userss.push(collection.dataValues.userId)
             })
            if(uniqueDay.length>0){
                let Dates=uniqueDay.map((days)=>(
                     days.dataValues.date
            ))
                console.log("************Days***********", Dates)
                let ate=[...new Set(Dates)]
                console.log("************UniqueDays***********", ate.length)
                weeklyCollected.workingDay=ate.length
            }

            if(uniqueCustomers.length){
                let customers=uniqueCustomers.map((customer)=>(
                    customer.dataValues.customerPhone
                    
                ))

                console.log("************-----------Customers--------***********", customers)
                weeklyCollected.totalAccount=customers.length
            }

            let uniqueUserss=new Set(userss)
            let userrs=[...uniqueUserss]
            await Promise.all(userrs.map(async Id=>{
                let dateRangeCollectionPerUser=0
                let collectionPeruserID=await performanceModel.findAll({where:{userId:Id,date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                let IdUser= await userModel.findOne({where:{userId:Id}})
                let name=IdUser.dataValues.userName
                if (collectionPeruserID.length>0){
                    console.log("===========````````````````Unique customers``````````````````=================",uniqueCustomers.length)
                    collectionPeruserID.map(amount=>{
                        dateRangeCollectionPerUser += amount.dataValues.collectedAmount
                    })
                    weeklyPerUser[`${name}`]=dateRangeCollectionPerUser
                }else{
                    weeklyPerUser[`${name}`]=dateRangeCollectionPerUser  
                }
            }))
            weeklyCollected.dateRangeTotal=weeklytotal
            weeklyCollected.PerUser=weeklyPerUser
            weeklyCollected.up_to_DateTotalCollection=totalAmount[0].totalSum
            weeklyCollected.up_to_DateTotalAccount=allCustomer
            weeklyCollected.up_to_DateWorkingDay=collectionDate.length
            weeklyCollected.GivenDateAmount=givenDateTotalAmount[0].totalSum
            res.status(200).json({message:"succed", data:weeklyCollected})
        }
        else{
            res.status(200).json({message:"No collection Data in given date"})
        }
    }catch(error){
        console.log("this is an error", error)
        res.status(500).json({message:"An internal error"})
    }

    console.log("The date range >>>>>>>>>>>>>>>>", dateRange)
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

    console.log("this is userName", userName)
    try{
        const userData=await userModel.findOne({where:{userName:userName}})
        const userStatus={}
        if(userData){
            const user= await collectionController.findAll({where:{userId:userData.userId}})
            console.log("the user", user)
            if(user.length>0){
                let totalCollected=0
                let monthlyCollected=0
                let yesterdayCollected=0
                await user.map(amount=>{
                    console.log("this daily amount", amount.dataValues.payedAmount)
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
                console.log("this is total amount", userData)
            }else{
                res.status(200).json({message:"No data"})
                }
            }else{
                res.status(200).json({
                    message:"User doesn't exist"
                })
            }
    }catch(error){
        res.status(500).json({message:"An internal error"})
     }
    }
}

const collectedAmount=async(req,res)=>{
    try{
        const collectionData=await collectionController.findAll()
        const allUser=await performanceModel.findAll({attributes:["userId"]})
        const collectionStatus={allUserColletion:0}
        let usersID=[]
        console.log("this is all userData", allUser)
        if(allUser.length>0){
            allUser.map(data=>{
                usersID.push(data.dataValues.userId)
            })
        }
        const totalPerformance=await performanceModel.findAll()
        let collectedAmounts=0
        if(collectionData.length>0){
            if(usersID.length>0){
              let uniqueUser=new Set(usersID)
              let users=[... uniqueUser]
              console.log("this is unique user", users)
              await Promise.all( users.map(async userIDs=>{
                let userData= await performanceModel.findAll({where :{userId:userIDs}})
                let totalCollectedPeruser=0
                if(userData.length>0){
                    userData.map(datass=>{
                        console.log("this is userperDay", datass.dataValues.collectedAmount)
                    totalCollectedPeruser +=datass.dataValues.collectedAmount
                    })
                   let userNames=await userModel.findOne({where:{userId:userIDs}})
                   let userName=userNames.dataValues.userName
                   console.log("The collection of All user",`{${userName}:${totalCollectedPeruser}}` )
                   collectionStatus[`${userName}`]=totalCollectedPeruser
                   console.log("this is all userColletion", collectionStatus.allUserColletion)
                   console.log("this is totalperUser", totalCollectedPeruser)
                   collectionStatus.allUserColletion +=totalCollectedPeruser
                   console.log("this is all userColletion", collectionStatus.allUserColletion)
                   
                }
              }))
            
           }
           collectionData.map(data=>{
            collectedAmounts += data.dataValues.payedAmount
           })
           collectionStatus.totalCollected=collectedAmounts
           res.status(200).json({message:"succed", data:collectionStatus})
        }else{
            res.status(500).json({message:"No data found"})
        }
    }catch(error){
        res.status(500).json({message:"An internal error"})
        console.log("this is an error", error)
    }
}


const allUserCollection=async(req, res)=>{
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

    const userStatus={monthlyCollection:0}
    const theData=[]
    dateList=[]
    try{
        
        let user= await userModel.findOne({where:{userName:userName}})
        if(user){
            let liveCollection= await performanceModel.findOne({where:{userId:user.dataValues.userId, date:today}})
            if(liveCollection){
                userStatus.liveCollection=liveCollection.dataValues.collectedAmount
            }else{
                console.log("No live record")
                userStatus.liveCollection=0
            }
            const perviousData=await performanceModel.findAll({where:{userId:user.dataValues.userId}})
            console.log("this is a data", perviousData)
            if(perviousData.length>0){
                perviousData.map((data)=>{
                    let day=new Date(data.dataValues.date)
                    console.log("this is the month", day.getMonth(), previousMonth)
                    if (day.getMonth()+1==previousMonth && day.getFullYear()==previousYear){
                      theData.push(day)
                      userStatus.monthlyCollection +=data.collectedAmount
                    }
                    
                    console.log("this is pervious Date", previousDate)
                })
                console.log("this is performancePerviousMonth", userStatus,theData)
            }
            lastDateData=await performanceModel.findAll({order:[["date", "DESC"]]})
            if(lastDateData.length>0){
                lastDateData.map(data=>{
                    let dates= data.dataValues.date
                    if (dateList.includes(dates)){
                        console.log("the date already exist", dateList)
                    }else{
                    dateList.push(dates)
                    }
                })
                const uniqueDate=new Set(dateList)
                console.log("this is theDataSet of UniqueDate", uniqueDate)
                if(today==[...uniqueDate][0]){
                    previousDate=[...uniqueDate][1]
                    if(previousDate){
                        let yesterdayColletion= await performanceModel.findOne({where:{userId:user.dataValues.userId, date:previousDate}})
                        if(yesterdayColletion){
                            userStatus.previousColletion=yesterdayColletion.dataValues.collectedAmount
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
                    previousDate=[...uniqueDate][0]
                    let yesterdayColletion= await performanceModel.findOne({where:{userId:user.dataValues.userId,date:previousDate}})
                    if(yesterdayColletion){
                        userStatus.previousColletion=yesterdayColletion.dataValues.collectedAmount
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
            console.log("User doesn't exist")
        }
    }catch(error){
        console.log("this is an error", error)
        res.status(500).json({message:"An internal error"})
    }
}


const deleteUser=async(req, res)=>{
    let IDs=[
    "87369fec-9bea-4ea9-bb8b-9e2d00f7890c","b3cee723-1443-4604-8da6-c5928bbf77ca"
    ,"b0b043fe-c1f2-4ae6-a8ce-a859681a7e9e","627b17cd-1924-4d05-a77a-9d4a89bf6918"]
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
        let user= await userModel.findAll()
        if(user.length>0){
            let totalCustomer= [await Promise.all (user.map(async userid=>{
                let userHistory={userName:userid.dataValues.userName, fullName:userid.dataValues.fullName}
                console.log("this is user",userHistory)
                let userId=userid.dataValues.userId
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
                console.log("Status>>>>>>>>>>>>>>>", userHistory)
                userCollectionData.push(userHistory)
            }))]
            res.status(200).json({message:"succeed", data:userCollectionData})

            console.log("The total Customers", totalCustomer)
        }else{
            res.status(200).json({message:"No registerd ures"})
        }
    }
    catch(error){
        console.log("the error", error)
        res.status(500).json({message:"An internal error"})
    }
}


const totalcollectionDashboard=async(req, res)=>{
    const dateRange=req.body
    const collectionData=[]
    const userCollectionData=[]
    try{
        if (! dateRange.startDate){
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
                    console.log("************Days***********", Dates)
                    let ate=[...new Set(Dates)]
                    console.log("************UniqueDays***********", ate.length)
                    // weeklyCollected.workingDay=ate.length
                    cardData.workingDay=ate.length
                }else{
                    cardData.workingDay=1
                }

                cardData.totalAccounts=allCustomer
                cardData.totalCollecteds=totalAmount[0].totalSum

                let rangedCollection=[cardData]



                if(user.length>0){
                    let totalCustomer= [await Promise.all (user.map(async userid=>{
                        let fullName=userid.dataValues.fullName
                        console.log("this is user",userHistory)
                        let userId=userid.dataValues.userId
                        // res.status(200).json({message:"succeed", data:userid})
                        let customerCount=await collectionController.count(
                            {where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]},
                            callResponce:{[Op.in]:["payed","paid"]}}})
                        let totalAmount=await collectionController.findAll({where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                            // date:{[Op.between]:[dateRange.startDate, dateRange.endDate]},
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
                        console.log("Status>>>>>>>>>>>>>>>", userHistory)
                    }))]
                    userCollectionData.push(userHistory)
                    collectionData.push(rangedCollection)
                    collectionData.push(userCollectionData)
                    res.status(200).json({message:"succeed", data:collectionData})

                    console.log("The total Customers", totalCustomer)
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
                console.log("************Days***********", Dates)
                let ate=[...new Set(Dates)]
                console.log("************UniqueDays***********", ate.length)
                // weeklyCollected.workingDay=ate.length
                cardData.workingDay=ate.length
            }else{
                cardData.workingDay=1
            }

            cardData.totalAccounts=allCustomer
            cardData.totalCollecteds=totalAmount[0].totalSum

            let rangedCollection=[cardData]



            if(user.length>0){
                let totalCustomer= [await Promise.all (user.map(async userid=>{
                    let fullName=userid.dataValues.fullName
                    console.log("this is user",userHistory)
                    let userId=userid.dataValues.userId
                    // res.status(200).json({message:"succeed", data:userid})
                    let customerCount=await collectionController.count(
                        {where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]},
                        callResponce:{[Op.in]:["payed","paid"]}}})
                    let totalAmount=await collectionController.findAll({where:{userId:userId, date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}},
                        // date:{[Op.between]:[dateRange.startDate, dateRange.endDate]},
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
                    userCollectionData.push(userHistory)
                }))]
                collectionData.push(rangedCollection)
                collectionData.push(userCollectionData)
                res.status(200).json({message:"succeed", data:collectionData})

                console.log("The total Customers", totalCustomer)
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


const allCollection= async(req, res)=>{
    try{
        const allCollection =await collectionController.findAll()
        if(allCollection.length>0){
            await Promise.all(allCollection.map(async collectionData=>{
               let user=await userModel.findOne({where:{userId:collectionData.dataValues.userId}})
               if(user){
                console.log("The usersDATa------------", user)
                collectionData.dataValues.userName=user.dataValues.userName
                collectionData.dataValues.fullName=user.dataValues.fullName
               }
            }))
          res.status(200).json({message:"succeed", data:allCollection})
        }else{
            console.log("No data")
            res.status(200).json({message:"Data doesn't exist"})
        }
    }catch(error){
     console.log("The error", error)
     res.status(500).json({message:"An internal error"})
    }
}
module.exports={addColletionData,allCollection, totalcollectionDashboard, totalCustomerPerUser,totalCollectedPeruser, collectedAmount,CollectetionPerUser,deleteUser, totalCollectedPerDateRange}
