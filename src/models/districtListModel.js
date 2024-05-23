const { all } = require("axios")
const sequelize= require("../db/db")
const Sequelize= require("sequelize")


const districtList= sequelize.define("District_list", {
    listId:{
        type:Sequelize.UUID,
        allowNull:false,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true
    },
    districtName:{
        type:Sequelize.STRING,
        allowNull:false,
    },
    district:{
        type:Sequelize.TEXT,
        allowNull:false
    }
})

module.exports=districtList