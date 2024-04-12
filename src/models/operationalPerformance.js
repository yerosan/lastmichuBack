const sequelize=require("../db/db")
const Sequelize=require("sequelize")

const operationalPerformance=("Operation_performance",{
    performanceId:{
        type:Sequelize.UUID,
        defaulValue:Sequelize.UUIDV4,
        allowNull:false,
        primaryKey:true
    },
    useId:{
        type:Sequelize.UUID,
        allowNull:false
    },
    totalApproved:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    totalRejected:{
        type:Sequelize.INTEGER,
        allowNull:false,
    },
    totalApplicant:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    totalApproved:{
        type:Sequelize.FLOAT,
        allowNull:false
    }

})

module.exports= operationalPerformance