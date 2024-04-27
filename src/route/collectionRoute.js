const express=require("express")
const router=express.Router()
const collectionController=require("../controller/collectionController")
const { col } = require("sequelize")

router.post("/add", collectionController.addColletionData)
router.get("/users/:userName", collectionController.CollectetionPerUser)
router.get("/total", collectionController.collectedAmount)
router.post("/dateRange", collectionController.totalCollectedPerDateRange)
router.delete("/deleteUser", collectionController.deleteUser)
router.post("/customer", collectionController.totalCustomerPerUser)
router.post("/allCollection", collectionController.allCollection)
router.post("/dashboard",collectionController.totalcollectionDashboard )
router.patch("/update", collectionController.collectionUpdate)
router.post("/userCollection", collectionController.userCollection)
router.delete("/delete", collectionController.deleteCollectionData)

module.exports = router;