const { all } = require("axios")
const sequelize=require("../db/db")
const Sequelize=require("sequelize")


// const refund=sequelize.define("refund", {
//     refundId:{
//         type:Sequelize.UUID,
//         defaultValue:Sequelize.UUIDV4,
//         allowNull:false,
//         primaryKey:true
//     },
//     transectionReference:{
//         type:Sequelize.STRING,
//         allowNull:false,
//         // primaryKey:true
//     },
//     userId:{
//         type:Sequelize.UUID,
//         allowNull:false,
//     },
//     complainId:{
//         type:Sequelize.UUID,
//         allowNull:false,
//     },
//     debitAccount:{
//         type:Sequelize.STRING,
//         allowNull:false,
//     },
//     creditAccount:{
//         type:Sequelize.STRING,
//         allowNull:false
//     },
//     amount:{
//         type:Sequelize.FLOAT,
//         allowNull:false
//     },
//     remark:{
//         type:Sequelize.TEXT,
//         allowNull:false
//     },
//     issueDate:{
//         type:Sequelize.DATEONLY,
//         allowNull:false
//     },
//     transectionDate:{
//         type: Sequelize.DATEONLY,
//         allowNull: true,
//         defaultValue: Sequelize.NOW, // Default value to current date
//     }
    
// })

// module.exports=refund

// const refund = sequelize.define("refund", {
//     refundId: {
//         type: Sequelize.UUID,
//         defaultValue: Sequelize.UUIDV4,
//         allowNull: false,
//         primaryKey: true
//     },
//     transectionReference: {
//         type: Sequelize.STRING,
//         allowNull: false,
//     },
//     userId: {
//         type: Sequelize.UUID,
//         allowNull: false,
//     },
//     complainId: {
//         type: Sequelize.UUID,
//         allowNull: false, // Foreign key
//     },
//     debitAccount: {
//         type: Sequelize.STRING,
//         allowNull: false,
//     },
//     creditAccount: {
//         type: Sequelize.STRING,
//         allowNull: false,
//     },
//     amount: {
//         type: Sequelize.FLOAT,
//         allowNull: false,
//     },
//     remark: {
//         type: Sequelize.TEXT,
//         allowNull: false,
//     },
//     issueDate: {
//         type: Sequelize.DATEONLY,
//         allowNull: false,
//     },
//     transectionDate: {
//         type: Sequelize.DATEONLY,
//         allowNull: true,
//         defaultValue: Sequelize.NOW,
//     }
// });

// refund.belongsTo(require("./reconciliation"), { foreignKey: "complainId", targetKey: "complainId" }); // Association
// module.exports = refund;







// const sequelize = require("../db/db");
// const Sequelize = require("sequelize");
const Complain = require("./reconciliation"); // Import the Complain model
const userInfo=require("./userModel")

const refund = sequelize.define("refund", {
    refundId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    transectionReference: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    userId: {
        type: Sequelize.UUID,
        allowNull: false,
    },
    customerAccount:{
        type:Sequelize.STRING,
        allowNull:false
    },
    complainId: {
        type: Sequelize.UUID,
        allowNull: false, // Foreign key
    },
    debitAccount: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    creditAccount: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    transectionType:{
        type:Sequelize.STRING,
        allowNull:false
    },
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    remark: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    issueDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    transectionDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: Sequelize.NOW,
    },
});

module.exports = refund;

