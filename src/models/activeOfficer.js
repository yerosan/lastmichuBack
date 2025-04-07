// const sequelize = require("../db/db");
// const { DataTypes } = require("sequelize");
// const UserInformations = require("./userModel"); // Import User Model

// const ActiveOfficers = sequelize.define("Active_officers", {
//     officerId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         primaryKey: true,
//         references: {
//             model: UserInformations, // Reference UserInformations table
//             key: "userId", // Reference userId in UserInformations
//         },
//         onUpdate: "CASCADE",
//         onDelete: "CASCADE", // If user is deleted, set officerId to NULL
//     },
//     officerStatus: {
//         type: DataTypes.ENUM("active", "inactive"),
//         allowNull: false,
//     },
// }, {
//     tableName: "active_officers",
//     timestamps: true,
// });

// // Define Association
// ActiveOfficers.belongsTo(UserInformations, { foreignKey: "officerId", targetKey: "userId", as: "user" });

// module.exports = ActiveOfficers;








const sequelize = require("../db/db");
const { DataTypes } = require("sequelize");
const UserInformations = require("./userModel");

const ActiveOfficers = sequelize.define("Active_officers", {
    officerId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: UserInformations,
            key: "userId",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    },
    officerStatus: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
    },
    team: {
        type: DataTypes.ENUM("recovery", "follow_up"),
        allowNull: false,
        defaultValue: "follow_up"  // Set a default value if needed
    }
}, {
    tableName: "active_officers",
    timestamps: true,
});

// Define Association
ActiveOfficers.belongsTo(UserInformations, { foreignKey: "officerId", targetKey: "userId", as: "user" });

module.exports = ActiveOfficers;


