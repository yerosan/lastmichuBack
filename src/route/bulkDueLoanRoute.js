// const express=require("express")
// const router=express.Router()
// const dueLoanController=require("../controller/bulkAssignment")
// const { col } = require("sequelize")
// const assignController=require("../controller/assignedCustomer")


// router.post("/upload", upload.single("file"), dueLoanController.addBulkData)




  

// const express = require("express");
// const router = express.Router();
// const dueLoanController = require("../controller/bulkAssignment");
// const actualDataUpload=require("../controller/actualCollection")
// const multer = require("multer");
// const appUrl = require("./src/config/config");




// const fileUploadCorsOptions = {
//     origin: function (origin, callback) {
//       const allowedOrigins = [
//         appUrl,
//         'http://localhost:3000', 
//         'http://localhost:4050',
//         // Add any other origins that need access
//       ];
      
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error('CORS not allowed for this origin'));
//       }
//     },
//     methods: ['POST', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//     credentials: true
//   };


// const upload = multer({ dest: "uploads/" });

// // 📤 Upload CSV Route
// router.post("/upload",cors(fileUploadCorsOptions), upload.single("file"), dueLoanController.addBulkData);
// router.post("/collectionUpload",cors(fileUploadCorsOptions), upload.single("file"), actualDataUpload.addBulkActualCollection);
// router.post("/getDueLoan", dueLoanController.gettingLoanByOfficer);

// module.exports = router;





const express = require("express");
const router = express.Router();
const cors = require("cors"); // Add this import
const dueLoanController = require("../controller/bulkAssignment");
const actualDataUpload = require("../controller/actualCollection");
const multer = require("multer");
const appUrl = require("../config/config");

const fileUploadCorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      appUrl,
      'http://localhost:3000', 
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

const upload = multer({ dest: "uploads/" });

// Handle OPTIONS preflight requests
router.options("/upload", cors(fileUploadCorsOptions));
router.options("/collectionUpload", cors(fileUploadCorsOptions));

// 📤 Upload CSV Route
router.post("/upload", cors(fileUploadCorsOptions), upload.single("file"), dueLoanController.addBulkData);
router.post("/collectionUpload", cors(fileUploadCorsOptions), upload.single("file"), actualDataUpload.addBulkActualCollection);
router.post("/getDueLoan", dueLoanController.gettingLoanByOfficer);

module.exports = router;
