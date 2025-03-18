const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const appUrl = require("./src/config/config");

const userRoute = require("./src/route/userRoute");
const collectionRoute = require("./src/route/collectionRoute");
const roleRoute = require("./src/route/roleRoute");
const salseRouter = require("./src/route/salseRouter");
const operationalRouter = require("./src/route/operationalRoute");
const complainRoute = require("./src/route/complainRoute");
const dueLoanRoute = require("./src/route/bulkDueLoanRoute");
const activeOfficerRoute = require("./src/route/activatOfficer");
const assignRoute = require("./src/route/assignLoan");
const contactecCustomer = require("./src/route/customerInteraction");
const paymentRoute = require("./src/route/payment");
const staticsRoute = require("./src/route/statistics");

const Refund = require("./src/models/refundModel");
const Complain = require("./src/models/reconciliation");
const UserInfo = require("./src/models/userModel");
const cdkSequelize = require("./src/db/db");


// 🏗️ Initialize Express App
const app = express();
app.use(express.json());
app.use(helmet());


// 🌍 CORS Setup with enhanced file upload support
const allowedOrigins = [`${appUrl}`, "http://localhost:3000", "https://your-production-url.com", "http://10.12.51.20:4050"];
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("❌ CORS not allowed for this origin"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Content-Length",
        ],
        exposedHeaders: ["Content-Disposition","Content-Length"], // Important for file downloads
        credentials: true,
        maxAge: 86400 // Cache preflight requests for 24 hours
    })
);



// 📌 Define Associations
Refund.belongsTo(Complain, { foreignKey: "complainId", targetKey: "complainId" });
Refund.belongsTo(UserInfo, { foreignKey: "userId", targetKey: "userId" });
Complain.belongsTo(UserInfo, { foreignKey: "userId", targetKey: "userId" });
UserInfo.hasMany(Refund, { foreignKey: "userId", targetKey: "userId" });
UserInfo.hasMany(Complain, { foreignKey: "userId", targetKey: "userId" });
Complain.hasMany(Refund, { foreignKey: "complainId", sourceKey: "complainId" });

// 🔗 Database Connection Handling
cdkSequelize.authenticate()
    .then(() => cdkSequelize.sync())
    .then(() => console.log("✅ Database successfully synced"))
    .catch((error) => {
        console.error("❌ Database Connection Failed:", error);
        process.exit(1); // Stop if DB fails
    });

// 🛠️ API Routes
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
app.use("/statics", staticsRoute)

// 🛑 Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🔥 Global Error:", err.message);
    res.status(500).json({ error: "Something went wrong, please try again later." });
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// 🔴 Prevent Backend Crash on Unhandled Errors
process.on("uncaughtException", (err) => {
    console.error("🚨 Uncaught Exception:", err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.error("⚠️ Unhandled Promise Rejection:", err);
    process.exit(1);
});
