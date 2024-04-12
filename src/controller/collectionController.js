const CollectionModel = require("../models/CollectionModel")
const collectionController=require("../models/CollectionModel")
const userModel=require("../models/userModel")
const performanceModel=require("../models/collectionPerformance")
const { where,Op } = require("sequelize")

const addColletionData=async(req, res)=>{
    const dataSet=req.body
    if(!dataSet.userName || 
        !dataSet.customerPhone||
        !dataSet.callResponce
        ){ 
            res.status(404).json({message:"All field is required"})
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
                    if(addCollection.dataValues.payedAmount !=0){
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
                    }
                }

                else{
                    res.status(403).json({message:"unable to add data"})
                }
            }else{
                res.status(403).json({message:"user doesn't exist"})
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

const totalCollectedPerDateRange=async(req, res)=>{
    const dateRange=req.body
    if(!dateRange.startDate|| !dateRange.endDate){
        res.status(200).json({message:"Date range is required"})
    }

    try{
        let collectionPerDate=await performanceModel.findAll({where:{date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
        let weeklyCollected={}
        let weeklytotal=0
        let userss=[]
        if (collectionPerDate.length>0){
             collectionPerDate.map(collection=>{
                weeklytotal +=collection.dataValues.collectedAmount
                userss.push(collection.dataValues.userId)
             })
            let uniqueUserss=new Set(userss)
            let userrs=[...uniqueUserss]
            await Promise.all(userrs.map(async Id=>{
                let dateRangeCollectionPerUser=0
                let collectionPeruserID=await performanceModel.findAll({where:{userId:Id,date:{[Op.between]:[dateRange.startDate, dateRange.endDate]}}})
                let IdUser= await userModel.findOne({where:{userId:Id}})
                let name=IdUser.dataValues.userName
                if (collectionPeruserID.length>0){
                    collectionPeruserID.map(amount=>{
                        dateRangeCollectionPerUser += amount.dataValues.collectedAmount
                    })
                    weeklyCollected[`${name}`]=dateRangeCollectionPerUser
                }else{
                    weeklyCollected[`${name}`]=dateRangeCollectionPerUser  
                }
            }))
            weeklyCollected.dateRangeTotal=weeklytotal
            res.status(200).json({message:"succed", data:weeklyCollected})
        }
        else{
            res.status(200).json({message:"No collection Data in given date"})
        }
    }catch(error){
        console.log("this is an error", error)
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
module.exports={addColletionData, totalCollectedPeruser, collectedAmount,CollectetionPerUser,deleteUser, totalCollectedPerDateRange}
