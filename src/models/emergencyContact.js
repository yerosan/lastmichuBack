const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const EmergencyContact = sequelize.define("emergency_contact_responses", {
    ecr_id: {
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
    emergency_response: {
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
    tableName: "emergency_contact_responses"
});

module.exports = EmergencyContact;