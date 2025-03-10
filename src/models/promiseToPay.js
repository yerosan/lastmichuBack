const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const Promise_to_pay = sequelize.define("promise_to_pays", {
    ptp_id: {
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
    remark: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    status:{
        type: DataTypes.ENUM("notable", "noted"),
        allowNull: false,
        defaultValue: "notable"
    },

    ptp_date: {
        type: DataTypes.DATEONLY,  // ✅ Stores only YYYY-MM-DD format
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: "promise_to_pays"
});

module.exports = Promise_to_pay;