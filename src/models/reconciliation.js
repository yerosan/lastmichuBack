const { all } = require("axios")
const sequelize=require("../db/db")
const Sequelize=require("sequelize")


// const reconciliation=sequelize.define("complain", {
//     complainId:{
//         type:Sequelize.UUID,
//         defaultValue:Sequelize.UUIDV4,
//         allowNull:false,
//         primaryKey:true
//     },
//     userId:{
//         type:Sequelize.UUID,
//         allowNull:false
//     },
//     customerAccount:{
//         type:Sequelize.STRING,
//         allowNull:false,
//     },
//     customerPhone:{
//         type:Sequelize.STRING,
//         allowNull:null
//     },
//     caseType:{
//         type:Sequelize.STRING,
//         allowNull:false
//     },
//     transectionDate:{
//        type:Sequelize.DATEONLY,
//        allowNull:false
//     }
    
// })

// module.exports=reconciliation


// const dbSequelize = require("../db/db"); // Import the Sequelize instance
// const Sequelize = require("sequelize");

// Define the Reconciliation model
// const Reconciliation = sequelize.define("complain", {
//     complainId: {
//         type: Sequelize.UUID,
//         defaultValue: Sequelize.UUIDV4,
//         allowNull: false,
//         primaryKey: true,
//     },
//     userId: {
//         type: Sequelize.UUID,
//         allowNull: false,
//     },
//     customerPhone: {
//         type: Sequelize.STRING,
//         allowNull: false,
//     },
//     customerAccount: {
//         type: Sequelize.STRING,
//         allowNull: false,
//     },
//     caseType: {
//         type: Sequelize.STRING,
//         allowNull: false,
//     },
//     transectionDate: {
//         type: Sequelize.DATEONLY,
//         allowNull: false,
//     },
// });

// // Define association with Refund
// const Refund = require("./refundModel"); // Import Refund model
// Reconciliation.hasMany(Refund, { foreignKey: "complainId", sourceKey: "complainId" });

// module.exports = Reconciliation;

// const Sequelize = require("sequelize");
// const sequelize = require("../db/db");

const Complain = sequelize.define("complain", {

    complainId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    userId: {
        type: Sequelize.UUID,
        allowNull: false,
    },
    customerPhone: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    customerAccount: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    caseType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    transectionDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    // complainId: {
    //     type: Sequelize.UUID,
    //     defaultValue: Sequelize.UUIDV4,
    //     primaryKey: true,
    // },
    // description: {
    //     type: Sequelize.STRING,
    //     allowNull: false,
    // },
    // status: {
    //     type: Sequelize.STRING,
    //     allowNull: false,
    // },
    // createdDate: {
    //     type: Sequelize.DATE,
    //     defaultValue: Sequelize.NOW,
    // },
});

module.exports = Complain;

