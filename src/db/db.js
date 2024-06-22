const Sequelize=require("sequelize")
const dotenv=require("dotenv")
dotenv.config()
const dbSequelize=new Sequelize(
    "michu_dashBoard",
    process.env.db_userName,
    process.env.db_password,
    {
     dialect:"mysql",
     host:"localhost",
     logging: false,
    }

)

module.exports=dbSequelize