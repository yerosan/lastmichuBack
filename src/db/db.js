const Sequelize=require("sequelize")
const dotenv=require("dotenv")
dotenv.config()
const dbSequelize=new Sequelize(
    "michu_dashBoard",
    process.env.db_userName,
    process.env.db_password,
    {
     dialect:"mysql",
    //  host:"localhost",
    host:"10.12.51.21",
    logging: false,
    dialectOptions: {
        connectTimeout: 60000, // 60 seconds
      },
      pool: {
        max: 20, // Increase the max number of connections
        min: 5,  // Minimum number of connections
        acquire: 60000, // Maximum time (ms) to wait for a connection
        idle: 10000, // Time (ms) a connection can be idle before being released  
    },
    retry: {
      max: 10,
      match: [/Sequelize.*Error/, /TimeoutError/],
      backoffBase: 1000
    },

    }

)

module.exports=dbSequelize