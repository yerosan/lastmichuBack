const sequelize=require("../db/db")
const Sequelize=require("sequelize")
const prediction= sequelize.define("predicton_information",{
    predictionId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false
    },
    bloodPressure:{
        type:Sequelize.FLOAT,
        allowNull:false,
    },
    Albumin:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    bloodUrea:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    serumCreatinine:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    diabetesMellitus:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    predictedValue:{
        type:Sequelize.INTEGER,
        allowNull:false
    }

})

module.exports=prediction