const sequelize=require("../db/db")
const Sequelize=require("sequelize")


const CollectionModel=sequelize.define("Collection_data",{
    collectionId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        allowNull:false,
        primaryKey:true
    },
    userId:{
        type:Sequelize.UUID,
        allowNull:false
    },
    customerPhone:{
        type:Sequelize.STRING,
        allowNull:false,
    },
    callResponce:{
        type:Sequelize.STRING,
        allowNull:false,
    },
    paymentStatus:{
        type:Sequelize.STRING,
        allowNull:false,
        defaultValue:'notPaid'
    },
    payedAmount:{
        type:Sequelize.FLOAT,
        allowNull:false,
        defaultValue:0
    },
    date:{
        type:Sequelize.DATEONLY,
        allowNull:false,
        defaultValue: Sequelize.DATE.NOW,
    }
})

module.exports=CollectionModel


// 
// Let's Talk in English- Full DVD 