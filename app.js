// const express=require("express")
// const cors=require("cors")
// const appUrl=require("./src/config/config")
// const userRoute=require("./src/route/userRoute")
// const collectionRoute=require("./src/route/collectionRoute")
// const roleRoute=require("./src/route/roleRoute")
// const salseRouter=require("./src/route/salseRouter")
// const operationalRouter=require("./src/route/operationalRoute")
// const complainRoute=require("./src/route/complainRoute")
// const dueLoanRoute=require("./src/route/bulkDueLoanRoute")

// const Refund = require("./src/models/refundModel");
// const Complain = require("./src/models/reconciliation");
// const UserInfo=require("./src/models/userModel")

// const activeOfficerRoute=require("./src/route/activatOfficer")
// const assignRoute=require("./src/route/assignLoan")
// const contactecCustomer=require("./src/route/customerInteraction")
// const paymentRoute=require("./src/route/payment")

// app=express()

// app.use(express.json())
// const cdkSequelize= require("./src/db/db")
// const userInfo = require("./src/models/userModel")
// const refund = require("./src/models/refundModel")


// // Define Associations
// Refund.belongsTo(Complain, { foreignKey: "complainId", targetKey: "complainId" });
// Refund.belongsTo(UserInfo, {foreignKey:"userId",targetKey:"userId"})
// Complain.belongsTo(UserInfo,{foreignKey:"userId",targetKey:"userId"})
// userInfo.hasMany(Refund,{foreignKey:"userId",targetKey:"userId"})
// userInfo.hasMany(Complain,{foreignKey:"userId",targetKey:"userId"})
// Complain.hasMany(Refund, { foreignKey: "complainId", sourceKey: "complainId" });

// cdkSequelize.authenticate().then(()=>{
//     cdkSequelize.sync().then(()=>{
//         console.log("db is successfully synced")
//     })
// }).catch(error=>{
//     console.log("An internal error",error)
// })

// app.use(cors({
//     origin: `${appUrl}`, 
//     credentials: true 
// })

// );
// app.use("/user", userRoute)
// app.use("/collection", collectionRoute)
// app.use("/role", roleRoute)
// app.use("/salse", salseRouter)
// app.use("/operational", operationalRouter)
// app.use("/complain", complainRoute)
// app.use("/dueLoan", dueLoanRoute)
// app.use("/officer", activeOfficerRoute)
// app.use("/assign",assignRoute)
// app.use("/contact", contactecCustomer)
// app.use("/payment", paymentRoute)

// app.listen(3000, ()=>{
//     console.log("app is listening in port 3000")
// })




const express = require("express");
const cors = require("cors");
const appUrl = require("./src/config/config");
const userRoute = require("./src/route/userRoute");
const collectionRoute = require("./src/route/collectionRoute");
const roleRoute = require("./src/route/roleRoute");
const salseRouter = require("./src/route/salseRouter");
const operationalRouter = require("./src/route/operationalRoute");
const complainRoute = require("./src/route/complainRoute");
const dueLoanRoute = require("./src/route/bulkDueLoanRoute");

const Refund = require("./src/models/refundModel");
const Complain = require("./src/models/reconciliation");
const UserInfo = require("./src/models/userModel");

const activeOfficerRoute = require("./src/route/activatOfficer");
const assignRoute = require("./src/route/assignLoan");
const contactecCustomer = require("./src/route/customerInteraction");
const paymentRoute = require("./src/route/payment");

const app = express();
app.use(express.json());

const cdkSequelize = require("./src/db/db");
const userInfo = require("./src/models/userModel");
const refund = require("./src/models/refundModel");

// Define Associations
Refund.belongsTo(Complain, { foreignKey: "complainId", targetKey: "complainId" });
Refund.belongsTo(UserInfo, { foreignKey: "userId", targetKey: "userId" });
Complain.belongsTo(UserInfo, { foreignKey: "userId", targetKey: "userId" });
userInfo.hasMany(Refund, { foreignKey: "userId", targetKey: "userId" });
userInfo.hasMany(Complain, { foreignKey: "userId", targetKey: "userId" });
Complain.hasMany(Refund, { foreignKey: "complainId", sourceKey: "complainId" });

// Database Connection Handling
cdkSequelize.authenticate()
    .then(() => {
        cdkSequelize.sync()
            .then(() => {
                console.log("✅ Database successfully synced");
            })
            .catch((error) => {
                console.error("❌ Sequelize Sync Error:", error);
            });
    })
    .catch((error) => {
        console.error("❌ Database Connection Error:", error);
    });

// CORS Middleware
app.use(
    cors({
        origin: `${appUrl}`,
        credentials: true,
    })
);

// API Routes
app.use("/user", userRoute);
app.use("/collection", collectionRoute);
app.use("/role", roleRoute);
app.use("/salse", salseRouter);
app.use("/operational", operationalRouter);
app.use("/complain", complainRoute);
app.use("/dueLoan", dueLoanRoute);
app.use("/officer", activeOfficerRoute);
app.use("/assign", assignRoute);
app.use("/contact", contactecCustomer);
app.use("/payment", paymentRoute);

// 🛑 Global Error Handling Middleware (Prevents Crashes)
app.use((err, req, res, next) => {
    console.error("🔥 Global Error:", err.message);
    res.status(500).json({ error: "Something went wrong, please try again later." });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// 🔴 Prevent Backend Crash on Unhandled Errors
process.on("uncaughtException", (err) => {
    console.error("🚨 Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("⚠️ Unhandled Promise Rejection:", err);
});