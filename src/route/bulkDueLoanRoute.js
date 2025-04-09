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
const cors = require("cors");
const dueLoanController = require("../controller/bulkAssignment");
const actualDataUpload = require("../controller/actualCollection");
const multer = require("multer");
const appUrl = require("../config/config");

// Configure multer with better error handling and file filtering
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Enhanced CORS configuration
const fileUploadCorsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            appUrl,
            'http://localhost:3000',
            'http://localhost:4050',
            'http://10.12.51.20:4050'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Origin ${origin} not allowed by CORS`);
            callback(new Error('CORS not allowed for this origin'));
        }
    },
    methods: ['POST', 'GET', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers'
    ],
    exposedHeaders: [
        'Content-Length',
        'Content-Disposition',
        'Content-Type'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 hours
};

// Middleware to handle file upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                status: 'error',
                message: 'File size too large. Maximum size is 10MB'
            });
        }
        return res.status(400).json({
            status: 'error',
            message: err.message
        });
    }
    next(err);
};

// Handle OPTIONS preflight requests
router.options('*', cors(fileUploadCorsOptions));

// Routes with enhanced error handling
router.put("/updateNPLStatus", 
    cors(fileUploadCorsOptions), 
    dueLoanController.bulkAssignNPLLoans
);

router.put("/updateNPLStatusAndTeam", 
    cors(fileUploadCorsOptions), 
    dueLoanController.updateNPLStatusAndTeam
);

// File upload routes with error handling
router.post("/upload", 
    cors(fileUploadCorsOptions),
    (req, res, next) => {
        upload.single("file")(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    },
    async (req, res, next) => {
        try {
            // Set explicit CORS headers
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            res.header('Access-Control-Allow-Credentials', 'true');
            
            await dueLoanController.addBulkData(req, res);
        } catch (error) {
            next(error);
        }
    }
);

router.post("/collectionUpload", 
    cors(fileUploadCorsOptions),
    (req, res, next) => {
        upload.single("file")(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    },
    actualDataUpload.addBulkActualCollection
);

router.post("/getDueLoan", 
    cors(fileUploadCorsOptions), 
    dueLoanController.gettingLoanByOfficer
);

// Global error handler for this router
router.use((err, req, res, next) => {
    console.error('Router Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = router;