const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const userInfo=sequelize.define("user_information",{
    userId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false
    },
    fullName:{
        type:Sequelize.STRING,
        allowNull:true,
    },
    userName:{
        type:Sequelize.STRING,
        allowNull:false

    },
    password:{
      type:Sequelize.STRING,
      allowNull:false
    },
})

module.exports=userInfo