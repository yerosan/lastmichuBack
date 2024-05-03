const sequelize=require("../db/db")
const Sequelize=require("sequelize")


const SalseModel= sequelize.define("Salse_data", {
    salseId:{
        type:Sequelize.UUID,
        allowNull:false,
        primaryKey:true,
        defaultValue:Sequelize.UUIDV4
    },
    userId:{
        type:Sequelize.UUID,
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

module.exports=SalseModel