const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const coopay=sequelize.define("coopay", {
    coopayId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false
    },

    transaction:{
        type:Sequelize.FLOAT,
        allowNull:false

    },
    value:{
        type:Sequelize.FLOAT,
        allowNull:false,
    },
    activeUsers:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    customers:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    agent:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    merchante:{
        type:Sequelize.FLOAT,
        allowNull:false
    }
})

module.exports=coopay