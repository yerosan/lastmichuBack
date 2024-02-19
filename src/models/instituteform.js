const sequelize=require("../db/db")
const Sequelize=require("sequelize")


const institute=sequelize.define("institute", {
    instituteId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false
    },
    parteners:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    waterSupplyTrans:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    transportTrans:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    educationTrans:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    telecomTrans:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    governmentTrans:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    entertainmentTrans:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    cooperativeTrans:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    
    transTotal:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    waterSupply:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    transport:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    education:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    telecom:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    government:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    entertainment:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    cooperative:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    totalAmount:{
        type:Sequelize.FLOAT,
        allowNull:false
    }
})


module.exports=institute