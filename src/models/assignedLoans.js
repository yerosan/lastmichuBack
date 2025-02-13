const sequelize = require("../db/db");
const { DataTypes } = require("sequelize");
const DueLoanData = require("./bulkAssignment"); // Import DueLoanData model
const ActiveOfficers = require("./activeOfficer"); // Import ActiveOfficers model

const AssignedLoans = sequelize.define("AssignedLoans", {
    assigned_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    loan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: DueLoanData, // References DueLoanData table
            key: "loan_id", // References the primary key in DueLoanData
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // If a loan is deleted, the assignment should also be deleted
    },
    officer_id: {
        type: DataTypes.UUID, // Matches the UUID type from ActiveOfficers
        allowNull: false,
        references: {
            model: ActiveOfficers, // References ActiveOfficers table
            key: "officerId", // References officerId in ActiveOfficers
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // If an officer is deleted, the assignment remains but officer_id is set to NULL
    },
    customer_phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    assigned_date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "assigned_loans",
    timestamps: true,
});

module.exports = AssignedLoans;
