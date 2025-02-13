const sequelize = require("../db/db");
const { DataTypes } = require("sequelize");

const LoanModel = sequelize.define("due_loan_datas", {
    loan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    branch_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // loan_id: {
    //     type: DataTypes.UUID,
    //     allowNull: false,
    //     unique: true,
    // },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customer_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^[0-9]{10,13}$/ // Ensures only 10-12 digit numbers
        }
    },
    saving_account: {
        type: DataTypes.STRING,
        allowNull: true
    },
    approved_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0,
            max: 100000
        }
    },
    product_type: {
        type: DataTypes.ENUM("Michu 1.0", "Michu Kiyya - Formal", "Michu Wabii"),
        allowNull: false
    },
    approved_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    maturity_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    outstanding_balance: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    due_principal: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    due_interest: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    due_penalty: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    total_dueAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    arrears_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    number_of_days_inArrears: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    officer_name:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:"Not Assigned"
    },
    uploaded_date: {
        type: DataTypes.DATEONLY,  // ✅ Stores only YYYY-MM-DD format
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}
);

module.exports = LoanModel;