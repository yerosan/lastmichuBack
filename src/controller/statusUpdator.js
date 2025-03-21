const { sequelize } = require("../models");

const updateLoanStatus = async (req, res) => {
    try {
        const [results, metadata] = await sequelize.query(`
           UPDATE due_loan_datas d
            JOIN actual_collection_data a ON d.loan_id = a.loan_id
            SET d.collection_status = 'Closed'
            WHERE a.application_status = 'CLOSED'
            AND d.collection_status = 'Active';
        `);

        return res.status(200).json({
            status: "succeed",
            message: "✅ Loan status updated successfully.",
            updatedRows: metadata.affectedRows || 0
        });
    } catch (error) {
        console.error("❌ Error updating loan status:", error);
        return res.status(500).json({
            status: "Error",
            message: "❌ Failed to update loan status.",
            error: error.message
        });
    }
};

module.exports = { updateLoanStatus };