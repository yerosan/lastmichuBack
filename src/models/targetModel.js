const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const targetModel=sequelize.define( "Sales_target",{
    targetId:{
        type:Sequelize.UUID,
        allowNull:false,
        primaryKey:true,
        defaultValue:Sequelize.UUIDV4
    },
    districtName:{
        type:Sequelize.STRING,
        allowNull:false
    },
    uniqueCustomer:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    numberOfAccount:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    disbursedAmount:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    income:{
        type: Sequelize.INTEGER,
        allowNull:false
    },
    date:{
        type:Sequelize.DATEONLY,
        allowNull:false,
        defaultValue:new Date
    }
})

module.exports= targetModel