const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");

const DistrictList = sequelize.define("district_list", {
    dis_Id: {
        type: DataTypes.CHAR(36),
        primaryKey: true
    },
    district_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    officer_Id:{
        type: DataTypes.CHAR(36),
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: "district_list"
});

module.exports = DistrictList;
