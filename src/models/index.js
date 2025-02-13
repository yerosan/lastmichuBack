const sequelize = require("../db/db");
const ActiveOfficers = require("./activeOfficer");
const DueLoanData = require("./bulkAssignment");
const AssignedLoans = require("./assignedLoans");
const UserInformations = require("./userModel");
const CustomerInteraction = require("./customerInteraction");
const Payment = require("./payments");
const PTPModel=require("./promiseToPay")
const ECRModel=require("./emergencyContact")

// CustomerInteraction Associations
CustomerInteraction.belongsTo(DueLoanData, { foreignKey: "loan_id", as: "loan" });
CustomerInteraction.belongsTo(ActiveOfficers, { foreignKey: "officer_id", as: "officer" });
Payment.belongsTo(ActiveOfficers, { foreignKey: "officer_id", as: "officer" });
// Payment Associations
Payment.belongsTo(DueLoanData, { foreignKey: "loan_id", as: "loan" });

// module.exports = { CustomerInteraction, Payment };


// Define Associations
AssignedLoans.belongsTo(DueLoanData, { foreignKey: "loan_id", targetKey: "loan_id", as: "loan",onDelete: "CASCADE" });
AssignedLoans.belongsTo(ActiveOfficers, { foreignKey: "officer_id", targetKey: "officerId", as: "officer",onDelete: "CASCADE" });
ActiveOfficers.belongsTo(UserInformations, { foreignKey: "officerId" ,targetKey: "userId",as:"userInfos", onDelete:"CASCADE" });

PTPModel.belongsTo(CustomerInteraction, { foreignKey: "ptp_id" ,targetKey: "interaction_id",as:"contectCustomer", onDelete:"CASCADE" });
ECRModel.belongsTo(CustomerInteraction, { foreignKey: "ecr_id" ,targetKey: "interaction_id",as:"contectCustomer", onDelete:"CASCADE" });

// Export all models from a single entry point
module.exports = {
    sequelize,         // Export Sequelize instance (optional but useful)
    ActiveOfficers,
    DueLoanData,
    AssignedLoans,
    UserInformations, 
    CustomerInteraction,
    Payment,
    PTPModel,
    ECRModel
};
