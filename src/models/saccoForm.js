const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const saccos=sequelize.define("saccos",{

    saccosId:{
        type:Sequelize.UUID,
        primarykey:true,
        defaultValue:Sequelize.UUIDV4,
        allowNull:false
    },
    saccos:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    saccosUnion:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    mpcus:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    total:{
        type:Sequelize.FLOAT,
        allowNull:false
    }

})

module.exports=saccos