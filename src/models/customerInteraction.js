const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const CustomerInteraction = sequelize.define("customer_interactions", {
    interaction_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    officer_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    loan_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    call_status: {
        // type: DataTypes.ENUM("contacted", "notContacted"),
        type:DataTypes.STRING,
        allowNull: false
    },
    call_response: {
        type:DataTypes.STRING,
        // type: DataTypes.ENUM("PTP", "refuse to pay", "switched off", "line busy"),
        allowNull: false
    },
    remark: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,  // ✅ Stores only YYYY-MM-DD format
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: "customer_interactions"
});

module.exports = CustomerInteraction;
