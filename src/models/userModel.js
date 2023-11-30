const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const userInfo=sequelize.define("user_information",{
    userId:{
        type:Sequelize.UUID,
        defaultValue:Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false
    },
    userName:{
        type:Sequelize.STRING,
        allowNull:true,
    },
    password:{
      type:Sequelize.STRING,
      allowNull:false
    },
    role:{
        type:Sequelize.STRING,
        allowNull:false
    }
})

module.exports=userInfo