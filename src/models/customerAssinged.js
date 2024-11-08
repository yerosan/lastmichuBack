const sequelize=require("../db/db")
const Sequelize=require("sequelize")


const assignedCustomer=sequelize.define("Assigned_customer",{
    assignedId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        allowNull:false,
        primaryKey:true
    },
    registererId:{
        type:Sequelize.UUID,
        allowNull:false
    },
    userId:{
        type:Sequelize.UUID,
        allowNull:false
    },
    totalAssignedCustomer:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    date:{
        type:Sequelize.DATEONLY,
        allowNull:false,
        defaultValue: Sequelize.DATE.NOW,
    }
})

module.exports=assignedCustomer