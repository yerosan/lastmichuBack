// const express=require("express")
// const router=express.Router()
// const dueLoanController=require("../controller/bulkAssignment")
// const { col } = require("sequelize")
// const assignController=require("../controller/assignedCustomer")


// router.post("/upload", upload.single("file"), dueLoanController.addBulkData)



const express = require("express");
const router = express.Router();
const dueLoanController = require("../controller/bulkAssignment");
const actualDataUpload=require("../controller/actualCollection")
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

// 📤 Upload CSV Route
router.post("/upload", upload.single("file"), dueLoanController.addBulkData);
router.post("/collectionUpload", upload.single("file"), actualDataUpload.addBulkActualCollection);
router.post("/getDueLoan", dueLoanController.gettingLoanByOfficer);

module.exports = router;
