const sequelize = require("../db/db");
const { DataTypes } = require("sequelize");
const UserInformations = require("./userModel"); // Import User Model

const ActiveOfficers = sequelize.define("Active_officers", {
    officerId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: UserInformations, // Reference UserInformations table
            key: "userId", // Reference userId in UserInformations
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // If user is deleted, set officerId to NULL
    },
    officerStatus: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
    },
}, {
    tableName: "active_officers",
    timestamps: true,
});

// Define Association
ActiveOfficers.belongsTo(UserInformations, { foreignKey: "officerId", targetKey: "userId", as: "user" });

module.exports = ActiveOfficers;
