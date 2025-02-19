// const fs = require("fs");
// const csv = require("csv-parser");
// const multer = require("multer");
// const { Sequelize } = require("sequelize");
// const actualCollectionModel = require("../models/actualCollecttion");
// const Ajv = require("ajv");

// const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });
// const upload = multer({ dest: "uploads/" });

// // Validation schema
// const schema = {
//     type: "object",
//     properties: {
//         branch_code: { type: "string", pattern: "^ET[A-Z0-9]{6,8}$" },
//         customer_id: { type: "string" },
//         loan_id: { type: "string" },
//         customer_name: { type: "string" },
//         phone_number: { type: "string", pattern: "^[0-9]{10,12}$" },
//         application_status: { type: "string" },
//         approved_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
//         maturity_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
//         approved_amount: { type: "number", minimum: 0 },
//         collection_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
//         principal_collected: { type: "number", minimum: 0 },
//         interest_collected: { type: "number", minimum: 0 },
//         penalty_collected: { type: "number", minimum: 0 },
//         total_collected: { type: "number", minimum: 0 },
//         collected_from: { type: "string" },
//         reason: { type: "string" },
//     },
//     required: ["branch_code", "loan_id", "phone_number", "approved_amount", "total_collected", "collection_date"]
// };

// const validate = ajv.compile(schema);

// const addBulkActualCollection = async (req, res) => {
//     if (!req.file) return res.status(200).json({ message: "No file uploaded" });

//     const filePath = req.file.path;
//     let rows = [];
//     try {
//         rows = await parseCSV(filePath);
//         if (rows.length === 0) {
//             return res.status(200).json({ message: "CSV file is empty" });
//         }
//     } catch (error) {
//         console.error("❌ Error parsing CSV:", error);
//         return res.status(500).json({ success: false, message: "Error reading file" });
//     }

//     // Validate bulk data
//     const validationErrors = validateBulkData(rows);
//     if (validationErrors !== "PASS") {
//         return res.status(200).json({ message: "Validation failed", errors: validationErrors });
//     }

//     // Insert into DB
//     const result = await insertIntoDB(rows);
//     fs.unlinkSync(filePath);

//     if (result.success) {
//         return res.status(200).json({
//             message: `✅ Successfully inserted ${result.insertedCount} records`,
//             data: { insertedCount: result.insertedCount, failedRows: Array.from(result.failedRows) }
//         });
//     } else {
//         return res.status(200).json({
//             message: result.message,
//             data: { insertedCount: result.insertedCount, failedRows: Array.from(result.failedRows) }
//         });
//     }
// };

// function parseCSV(filePath) {
//     return new Promise((resolve, reject) => {
//         const results = [];
//         fs.createReadStream(filePath)
//             .pipe(csv())
//             .on("data", (data) => results.push(data))
//             .on("end", () => resolve(results))
//             .on("error", (error) => reject(error));
//     });
// }

// function validateBulkData(data) {
//     const errors = [];
//     data.forEach((row, index) => {
//         const valid = validate(row);
//         if (!valid) {
//             errors.push({ index, errors: validate.errors });
//         }
//     });
//     return errors.length === 0 ? "PASS" : errors;
// }

// async function insertIntoDB(rows) {
//     let insertedCount = 0;
//     const transaction = await actualCollectionModel.sequelize.transaction();

//     try {
//         await actualCollectionModel.sync();
//         const filteredRows = rows

//         if (filteredRows.length > 0) {
//             await actualCollectionModel.bulkCreate(filteredRows, { transaction });
//             insertedCount = filteredRows.length;
//             await transaction.commit();
//             return { success: true, insertedCount, failedRows: existingMap };
//         } else {
//             return { success: false, message: "⚠️ No new records to insert (all were duplicates)", insertedCount, failedRows: existingMap };
//         }

//     } catch (error) {
//         await transaction.rollback();
//         console.error("❌ Transaction failed. Rolling back...", error);
//         return { success: false, message: "Upload failed", insertedCount: 0, failedRows: rows };
//     }
// }

// module.exports = { addBulkActualCollection, upload };





const fs = require("fs");
const csv = require("csv-parser");
const multer = require("multer");
const { Sequelize } = require("sequelize");
const actualCollectionModel = require("../models/actualCollecttion");
const Ajv = require("ajv");
const dayjs = require("dayjs");

const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });
const upload = multer({ dest: "uploads/" });

// Validation schema
const schema = {
    type: "object",
    properties: {
        branch_code: { type: "string", pattern: "^ET[A-Z0-9]{6,8}$" },
        customer_id: { type: "string" },
        loan_id: { type: "string" },
        customer_name: { type: "string" },
        phone_number: { type: "string", pattern: "^[0-9]{10,12}$" },
        application_status: { type: "string" },
        approved_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        maturity_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        approved_amount: { type: "number", minimum: 0 },
        collection_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        principal_collected: { type: "number", minimum: 0 },
        interest_collected: { type: "number", minimum: 0 },
        penalty_collected: { type: "number", minimum: 0 },
        total_collected: { type: "number", minimum: 0 },
        collected_from: { type: "string" },
        reason: { type: "string" },
    },
    required: ["branch_code", "loan_id", "phone_number", "approved_amount", "total_collected", "collection_date"]
};

const validate = ajv.compile(schema);

const addBulkActualCollection = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const filePath = req.file.path;
    try {
        let rows = await parseCSV(filePath);
        if (rows.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ success: false, message: "CSV file is empty" });
        }

        // Convert dates to "YYYY-MM-DD"
        rows = rows.map(row => ({
            ...row,
            approved_date: formatDate(row.approved_date),
            maturity_date: formatDate(row.maturity_date),
            collection_date: formatDate(row.collection_date),
        }));

        // Validate bulk data
        const validationErrors = validateBulkData(rows);
        if (validationErrors.length > 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ success: false, message: "Validation failed", errors: validationErrors });
        }

        // Insert into DB
        const result = await insertIntoDB(rows);
        fs.unlinkSync(filePath);

        return res.status(200).json(result);
    } catch (error) {
        fs.unlinkSync(filePath);
        console.error("❌ Error in bulk upload:", error);
        return res.status(500).json({ success: false, message: "Server error during file processing" });
    }
};

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });
}

// Convert YYYYMMDD to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString || dateString.length !== 8) return dateString; // Return as is if invalid
    return dayjs(dateString, "YYYYMMDD").format("YYYY-MM-DD");
}

function validateBulkData(data) {
    const errors = [];
    data.forEach((row, index) => {
        if (!validate(row)) {
            errors.push({ row: index + 1, errors: validate.errors });
        }
    });
    return errors;
}

async function insertIntoDB(rows) {
    let insertedCount = 0;
    const transaction = await actualCollectionModel.sequelize.transaction();

    try {
        await actualCollectionModel.sync();
        await actualCollectionModel.bulkCreate(rows, { transaction });
        insertedCount = rows.length;

        await transaction.commit();
        return { success: true, message: `✅ Successfully inserted ${insertedCount} records` };
    } catch (error) {
        await transaction.rollback();
        console.error("❌ Transaction failed. Rolling back...", error);
        return { success: false, message: "Upload failed due to database error", error: error.message };
    }
}

module.exports = { addBulkActualCollection };
