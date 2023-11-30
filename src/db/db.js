const Sequelize=require("sequelize")
const dotenv=require("dotenv")
dotenv.config()
const dbSequelize=new Sequelize(
    "cdk_db",
    process.env.db_userName,
    process.env.db_password,
    {
     dialect:"mysql",
     host:"localhost"
    }

)

module.exports=dbSequelize