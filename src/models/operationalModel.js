const sequelize = require("../db/db.js")
const Sequelize=require("sequelize")

const OperationModel=sequelize.define("Operational_data",{
    operationalId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false
    },
    userId:{
        type:Sequelize.UUID,
        allowNull:false
    },
    officerName:{
        type:Sequelize. STRING,
        allowNull:false
    },

    customerId:{
        type:Sequelize.STRING,
        allowNull:false
    },

    customerName:{
        type:Sequelize.STRING,
        allowNull:false
    },
    customerPhone:{
        type:Sequelize.STRING,
        allowNull:false
    },
    callStatus:{
        type:Sequelize.STRING,
        allowNull:false
    },
    applicationStatus:{
        type:Sequelize.STRING,
        allowNull:false
    },
    approvedAmount:{
       type:Sequelize.INTEGER,
       allowNull:false,
       defaultValue:0
    },
    RejectionReason:{
        type:Sequelize.TEXT,
        allowNull:false,
        defaultValue:"Verified"
    },
    approvalDate:{
        type:Sequelize.DATEONLY,
        allowNull:false
    }

});

module.exports= OperationModel