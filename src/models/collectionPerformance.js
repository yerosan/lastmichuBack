const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const performanceTable=sequelize.define("collceton_performance", {
    performanceId:{
        type:Sequelize.UUID,
        primaryKey:true,
        defaultValue:Sequelize.UUIDV4,
        allowNull:false
    },
    userId:{
        type:Sequelize.UUID,
        allowNull:false,
    },
    // totalContacted:{
    //     type:Sequelize.INTEGER,
    //     allowNull:false
    // },
    collectedAmount:{
        type:Sequelize.FLOAT,
        allowNull:false,
        defaultValue:0
    },
    date:{
        type:Sequelize.DATEONLY,
        allowNull:false,
        defaultValue:Sequelize.DATE.Now
    }
})

module.exports=performanceTable