const fs = require("fs");
const csv = require("csv-parser");
const multer = require("multer");
const { Sequelize, where } = require("sequelize");
const bulkAssignmentModel = require("../models/bulkAssignment");
const Ajv = require("ajv");
const { type } = require("os");
const { format } = require("path");

const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });
const upload = multer({ dest: "uploads/" });
const assignModel=require("../models/index")

const dayjs = require("dayjs");
const { error } = require("console");

// Validation schema
const schema = {
    type: "object",
    properties: {
        branch_code: { type: "string", pattern:"^ET[A-Z0-9]{6,8}$"},
        loan_id: {type:"string"},
        customer_name: { type: "string"},
        saving_account: {type:"string"},
        customer_number: { type: "string"},
        phone_number: { type: "string", pattern: "^[0-9]{10,12}$" },
        approved_amount: { type: "number", minimum: 0, maximum:100000 },
        product_type: 
        { type: "string",
             enum: ["Michu 1.0", "Michu Wabii",
                 "Michu Kiyya - Formal","Michu-Kiyya Informal"] },
        approved_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$"},
        maturity_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$"},
        outstanding_balance: { type: "number", minimum: 0 },
        due_principal: { type: "number", minimum: 0 },
        due_interest: { type: "number", minimum: 0 },
        due_penalty : {type:"number", minimum:0},
        total_due_amount:{type:"number", minimum:0},
        arrears_start_date:{type:'string', pattern: "^\\d{4}-\\d{2}-\\d{2}$"},
        number_of_Days_in_Arrears:{type: "number", minimum:0}

    },
    required: ["branch_code", "phone_number", "approved_amount", "approved_date", "maturity_date","product_type","arrears_start_date"]
};

const validate = ajv.compile(schema);

const addBulkData = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];  // Formats as YYYY-MM-DD
  const uploaded_date=today
    if (!req.file) return res.status(200).json({status:"error",message: "No file uploaded", error:null });

    const filePath = req.file.path;
    let rows = [];
    try {
        rows = await parseCSV(filePath);
        if (rows.length === 0) {
            return res.status(200).json({status:"error", message: "CSV file is empty", error:null });
        }
    } catch (error) {
        console.error("❌ Error parsing CSV:", error);
        return res.status(500).json({ status: "error", message: "Error reading file", errors:null });
    }


    // Convert dates to "YYYY-MM-DD"
    rows = rows.map(row => ({
        ...row,
        approved_date: formatDate(row.approved_date),
        maturity_date: formatDate(row.maturity_date),
        arrears_start_date: formatDate(row.arrears_start_date),
    }));

    // Validate bulk data

    const validationErrors = validateBulkData(rows);
        if (validationErrors !== "PASS") {
            return res.status(200).json({status:"error",message:"Validation failed",errors:validationErrors,});
        }
    // if (validationErrors !== "PASS") {
    //     return res.status(200).json({status:"error", message: "Validation failed", errors: validationErrors });

    // }

    // Insert into DB
    const result = await insertIntoDB(rows, uploaded_date);
    fs.unlinkSync(filePath);


    if (result.success) {
        return res.status(200).json({status:"success", message:`✅ Successfully inserted ${result.insertedCount} records`, data: { insertedCount: result.insertedCount,failedRows: Array.from(result.failedRows)}});
    } else {
        return res.status(200).json({status:"error", message: result.message,error:null, data: { insertedCount: result.insertedCount,failedRows: Array.from(result.failedRows)}});
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
//         const valid = validate(row);
//         if (!valid) {
//             errors.push({ index, errors: validate.errors });
//         }
//     });
//     return errors.length === 0 ? "PASS" : errors;
// }



function validateBulkData(data) {
    const errors = [];
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



async function insertIntoDB(rows, uploaded_date) { // Add uploaded_date as a parameter


  let insertedCount = 0;
  const transaction = await bulkAssignmentModel.sequelize.transaction();

  try {
      await bulkAssignmentModel.sync();
      const existingRecords = await bulkAssignmentModel.findAll({
        
        where: {
            loan_id: rows.map(row => row.loan_id),
        },
        attributes: ['loan_id']
    });
      const existingMap = new Set(existingRecords.map(rec => `${rec.loan_id}`));
      const filteredRows = rows.filter(row => !existingMap.has(`${row.loan_id}`));
      if (filteredRows.length > 0) {
        
          await bulkAssignmentModel.bulkCreate(filteredRows, {
              transaction
          });
          insertedCount = filteredRows.length;
          await transaction.commit();
          return { success: true, insertedCount, failedRows:existingMap};
      } else {
          return {success:false, message:"⚠️ No new records to insert (all were duplicates)",insertedCount,failedRows: existingMap }
      }

      await transaction.commit();
      return { success: true, insertedCount };
  } catch (error) {
      await transaction.rollback();
      console.error("❌ Transaction failed. Rolling back...", error);
      return { success: false, message: "Upload failed",insertedCount:0, failedRows: rows };
  }
}


const gettingLoanByOfficer=async(req, res)=>{
    const data=req.body
    try{
        let allData=await bulkAssignmentModel.findAll({
            where:{
                officer_name:data.officer_name,
                uploaded_date:"2025-02-14"
            },
            attributes:["loan_id", "phone_number", "officer_name","arrears_start_date"]
        })

        if(allData.length>0){
            let totalData=allData.length
            allData.map(async(item)=>{
                await assignModel.AssignedLoans.create({
                    loan_id:item.dataValues.loan_id,
                    officer_id:'c2c2c486-4d2f-40bb-a0ac-e4ad4fdef545',
                    customer_phone:item.dataValues.phone_number,
                    assigned_date:item.dataValues.arrears_start_date
                })
            })
            return res.status(200).json({message:"Success", data:allData, totaldata:totalData})
        }else{
            return res.status(200).json({message:"No data found"})
        }
        
    }catch(error){
        console.log("-----------Error", error)
        return res.status(500).json({message:"Internal server error", error:error})
    }
}

module.exports = { addBulkData, gettingLoanByOfficer};