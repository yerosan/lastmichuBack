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
    if (!req.file) return res.status(200).json({ status: "error", message: "No file uploaded" , errors:null});

    const filePath = req.file.path;
    try {
        let rows = await parseCSV(filePath);
        if (rows.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(200).json({ status: "error", message: "CSV file is empty", errors:null });
        }

        // Convert dates to "YYYY-MM-DD"
        rows = rows.map(row => ({
            ...row,
            approved_date: formatDate(row.approved_date),
            maturity_date: formatDate(row.maturity_date),
            collection_date: formatDate(row.collection_date),
        }));

        // Validate bulk data
        // const validationErrors = validateBulkData(rows);
        // if (validationErrors.length > 0) {
        //     fs.unlinkSync(filePath);
        //     return res.status(200).json({ status: "error", message: "Validation failed", errors: validationErrors });
        // }


        const validationErrors = validateBulkData(rows);
        if (validationErrors !== "PASS") {
            console.log("==============-----------------------===============Errors", validationErrors)
            fs.unlinkSync(filePath);
            return res.status(200).json({ 
                status: "error", 
                message: validationErrors.message, 
                errors: validationErrors.errorDetails 
            });
        }
        

        // Insert into DB
        const result = await insertIntoDB(rows);
        fs.unlinkSync(filePath);

        return res.status(200).json(result);
    } catch (error) {
        fs.unlinkSync(filePath);
        console.error("❌ Error in bulk upload:", error);
        return res.status(500).json({ status: "error", message: "Server error during file processing" , errors:null});
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

// function validateBulkData(data) {
//     const errors = [];
//     data.forEach((row, index) => {
//         if (!validate(row)) {
//             errors.push({ row: index + 1, errors: validate.errors });
//         }
//     });
//     return errors;
// }


// function validateBulkData(data) {
//     const errors = [];
//     const errorSummary = {};

//     data.forEach((row, index) => {
//         const valid = validate(row);
//         if (!valid) {
//             validate.errors.forEach((err) => {
//                 const field = err.instancePath.replace("/", ""); // Extract field name
//                 const message = `${field} ${err.message}`;

//                 if (!errorSummary[field]) {
//                     errorSummary[field] = { message, count: 0, examples: [] };
//                 }
//                 errorSummary[field].count += 1;
                
//                 // Store only first 3 examples per error type
//                 if (errorSummary[field].examples.length < 3) {
//                     errorSummary[field].examples.push({ row: index + 1, value: row[field] });
//                 }
//             });
//         }
//     });

//     if (Object.keys(errorSummary).length === 0) {
//         return "PASS";
//     }

//     return {
//         message: "Validation failed. Please fix the following errors.",
//         errorDetails: errorSummary
//     };
// }





function validateBulkData(data) {
    const errorSummary = {};

    data.forEach((row, index) => {
        const valid = validate(row);
        if (!valid) {
            validate.errors.forEach((err) => {
                const field = err.instancePath.replace("/", ""); // Extract field name
                const message = `${field} ${err.message}`;

                if (!errorSummary[field]) {
                    errorSummary[field] = { message, count: 0, examples: [] };
                }
                errorSummary[field].count += 1;
                
                // Store only first 3 examples per error type
                if (errorSummary[field].examples.length < 3) {
                    errorSummary[field].examples.push({ row: index + 1, value: row[field] });
                }
            });
        }
    });

    if (Object.keys(errorSummary).length === 0) {
        return "PASS";
    }

    return {
        message: "Validation failed. Please fix the following errors.",
        errorDetails: errorSummary
    };
}


// async function insertIntoDB(rows) {
//     let insertedCount = 0;
//     const transaction = await actualCollectionModel.sequelize.transaction();

//     try {
//         await actualCollectionModel.sync();
//         await actualCollectionModel.bulkCreate(rows, { transaction });
//         insertedCount = rows.length;

//         await transaction.commit();
//         return { status: "Success", message: `✅ Successfully inserted ${insertedCount} records` };
//     } catch (error) {
//         await transaction.rollback();
//         console.error("❌ Transaction failed. Rolling back...", error);
//         return { status: "error", message: "Upload failed due to database error", error: error.message };
//     }
// }


async function insertIntoDB(rows) {
    const transaction = await actualCollectionModel.sequelize.transaction();

    try {
        await actualCollectionModel.sync();

        // Step 1: Extract unique collection_date values from input rows
        const uniqueDates = [...new Set(rows.map(row => row.collection_date))];

        // Step 2: Check if any of these dates already exist in DB
        const existingDates = await actualCollectionModel.findAll({
            attributes: ['collection_date'],
            where: { collection_date: uniqueDates },
            raw: true
        });

        if (existingDates.length > 0) {
            // Step 3: If any date exists, return a message without inserting
            // const foundDates = existingDates.map(d => d.collection_date).join(', ');
            await transaction.rollback();
            return { 
                status: "error", 
                message: `⚠️ Data already exists for the given dates: . Please remove duplicates before uploading.`, 
                errors:null
            };
        }

        // Step 4: Proceed with bulk insert if no duplicate dates exist
        await actualCollectionModel.bulkCreate(rows, { transaction });
        await transaction.commit();
        
        return { status: "Success", message: `✅ Successfully inserted ${rows.length} records.`, errors:null};

    } catch (error) {
        await transaction.rollback();
        console.error("❌ Transaction failed. Rolling back...", error);
        return { status: "Error", message: "Upload failed due to database error", error: error.message, errors:null };
    }
}

module.exports = { addBulkActualCollection };
