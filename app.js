const express=require("express")
const cors=require("cors")
const appUrl=require("./src/config/config")
const userRoute=require("./src/route/userRoute")
const collectionRoute=require("./src/route/collectionRoute")
const roleRoute=require("./src/route/roleRoute")
const salseRouter=require("./src/route/salseRouter")
const operationalRouter=require("./src/route/operationalRoute")
const complainRoute=require("./src/route/complainRoute")
const dueLoanRoute=require("./src/route/bulkDueLoanRoute")

const Refund = require("./src/models/refundModel");
const Complain = require("./src/models/reconciliation");
const UserInfo=require("./src/models/userModel")

const activeOfficerRoute=require("./src/route/activatOfficer")
const assignRoute=require("./src/route/assignLoan")
const contactecCustomer=require("./src/route/customerInteraction")
const paymentRoute=require("./src/route/payment")

app=express()

app.use(express.json())
const cdkSequelize= require("./src/db/db")
const userInfo = require("./src/models/userModel")
const refund = require("./src/models/refundModel")


// Define Associations
Refund.belongsTo(Complain, { foreignKey: "complainId", targetKey: "complainId" });
Refund.belongsTo(UserInfo, {foreignKey:"userId",targetKey:"userId"})
Complain.belongsTo(UserInfo,{foreignKey:"userId",targetKey:"userId"})
userInfo.hasMany(Refund,{foreignKey:"userId",targetKey:"userId"})
userInfo.hasMany(Complain,{foreignKey:"userId",targetKey:"userId"})
Complain.hasMany(Refund, { foreignKey: "complainId", sourceKey: "complainId" });

cdkSequelize.authenticate().then(()=>{
    cdkSequelize.sync().then(()=>{
        console.log("db is successfully synced")
    })
}).catch(error=>{
    console.log("An internal error",error)
})

app.use(cors({
    origin: `${appUrl}`, 
    credentials: true 
})

);
app.use("/user", userRoute)
app.use("/collection", collectionRoute)
app.use("/role", roleRoute)
app.use("/salse", salseRouter)
app.use("/operational", operationalRouter)
app.use("/complain", complainRoute)
app.use("/dueLoan", dueLoanRoute)
app.use("/officer", activeOfficerRoute)
app.use("/assign",assignRoute)
app.use("/contact", contactecCustomer)
app.use("/payment", paymentRoute)

app.listen(3000, ()=>{
    console.log("app is listening in port 3000")
})