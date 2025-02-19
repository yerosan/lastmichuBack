const sequelize = require("../db/db");
const { DataTypes } = require("sequelize");

const ActualCollectionData = sequelize.define("actual_collection_data", {
    collection_id:{
        type:DataTypes.UUID,
        allowNull:false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,

    },
    branch_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    loan_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        // validate: {
        //     is: /^[0-9]{10,13}$/ // Ensures only 10-13 digit numbers
        // }
    },
    application_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    approved_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    maturity_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    approved_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    collection_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    principal_collected: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    interest_collected: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    penalty_collected: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    total_collected: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    collected_from: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false
    },
    officer_id: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    timestamps: true // Enables createdAt and updatedAt fields
});

module.exports = ActualCollectionData;
