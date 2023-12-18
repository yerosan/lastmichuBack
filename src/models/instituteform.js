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
    bill:{
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
    gateWay:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    total:{
        type:Sequelize.FLOAT,
        allowNull:false
    }
})


module.exports=institute