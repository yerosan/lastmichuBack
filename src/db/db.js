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
    // host:"10.12.51.21",
    logging: false,
    dialectOptions: {
        connectTimeout: 60000, // 60 seconds
      },
    }

)

module.exports=dbSequelize