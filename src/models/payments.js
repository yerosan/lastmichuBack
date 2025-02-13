const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Payment = sequelize.define("Payment", {
    payment_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    officer_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    phone_number: {
        type: DataTypes.UUID,
        allowNull: false
    },
    loan_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    payment_type: {
        type: DataTypes.ENUM("Fully Paid", "Partially Paid"),
        allowNull: false
    },
    payment_amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    remaining_balance: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    payment_date: {
        type: DataTypes.DATEONLY,  // ✅ Stores only YYYY-MM-DD format
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: "payments"
});

module.exports = Payment;