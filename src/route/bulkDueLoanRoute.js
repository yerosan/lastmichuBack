// const express = require("express");
// const router = express.Router();
// const cors = require("cors"); // Add this import
// const dueLoanController = require("../controller/bulkAssignment");
// const actualDataUpload = require("../controller/actualCollection");
// const multer = require("multer");
// const appUrl = require("../config/config");

// const fileUploadCorsOptions = {
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       appUrl,
//       'http://localhost:3000',
//       'http://10.12.51.20:4050', 
//     ];
    
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('CORS not allowed for this origin'));
//     }
//   },
//   methods: ['POST',"GET","DELETE","PUT","PATCH", 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', "Accept", "Origin"],
//   exposedHeaders: ['Content-Length', 'Content-Disposition'],  // Add exposed headers
//   credentials: true,
//   maxAge: 3600 // Add cache duration for preflight requests
//   // methods: ['POST', 'OPTIONS'],
//   // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', "Accept","Origin"],
//   // credentials: true
// };





// const upload = multer({ dest: "uploads/" });

// // Handle OPTIONS preflight requests
// router.options("/upload", cors(fileUploadCorsOptions));
// router.options("/collectionUpload", cors(fileUploadCorsOptions));
// router.options("/getDueLoan", cors(fileUploadCorsOptions));  // Add this line


// router.put("/updateNPLStatus", cors(fileUploadCorsOptions), dueLoanController.bulkAssignNPLLoans);
// router.put("/updateNPLStatusAndTeam", cors(fileUploadCorsOptions), dueLoanController.updateNPLStatusAndTeam);

// // 📤 Upload CSV Route
// router.post("/upload", cors(fileUploadCorsOptions), upload.single("file"), dueLoanController.addBulkData);
// router.post("/collectionUpload", cors(fileUploadCorsOptions), upload.single("file"), actualDataUpload.addBulkActualCollection);
// router.post("/getDueLoan", cors(fileUploadCorsOptions), dueLoanController.gettingLoanByOfficer);  // Add cors middleware
// // router.post("/getDueLoan", dueLoanController.gettingLoanByOfficer);

// module.exports = router;



const express = require("express");
const router = express.Router();
const multer = require("multer");
const dueLoanController = require("../controller/bulkAssignment");
const actualDataUpload = require("../controller/actualCollection");

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Remove individual CORS configurations from routes
router.put("/updateNPLStatus", dueLoanController.bulkAssignNPLLoans);
router.put("/updateNPLStatusAndTeam", dueLoanController.updateNPLStatusAndTeam);

// File upload routes
router.post("/upload", upload.single("file"), dueLoanController.addBulkData);
router.post("/collectionUpload", upload.single("file"), actualDataUpload.addBulkActualCollection);
router.post("/getDueLoan", dueLoanController.gettingLoanByOfficer);

// Add error handling for this router
router.use((err, req, res, next) => {
    console.error('Route Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

module.exports = router;