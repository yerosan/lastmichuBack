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
    totalApproved:{
       type:Sequelize.INTEGER,
       allowNull:false
    },
    totalRejected:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    totalApplicant:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    totalAmount:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    approvalDate:{
        type:Sequelize.DATE,
        allowNull:false
    }

});

module.exports= OperationModel