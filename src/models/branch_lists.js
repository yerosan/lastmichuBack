const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const BranchList = sequelize.define("branch_lists", {
    branch_code: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
    },
    dis_Id: {
        type: DataTypes.CHAR(36),
        allowNull: false
    },
    branch_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    created_date: {
        type: DataTypes.DATEONLY,  // Stores only YYYY-MM-DD format
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: "branch_list",
    timestamps:false
});

module.exports = BranchList;