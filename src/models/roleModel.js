const { toDefaultValue } = require("sequelize/lib/utils")
const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const roleModel=sequelize.define("role", {
    userId:{
        type:Sequelize.UUID,
        primaryKey:true,
        allowNull:false,
    },
    admin:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    operationalAdmin:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    collectionAdmin:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    salesAdmin:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    operationalUser:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    collectionUser:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    salesUser:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
})

module.exports=roleModel