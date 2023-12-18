const sequelize=require("../db/db")
const Sequelize=require("sequelize")


const fuel=sequelize.define("fuel",{
    fuelId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false
    },
    fuel:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    gasStation:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    tnx:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    amount:{
        type:Sequelize.FLOAT,
        allowNull:false
    }
})
module.exports=fuel