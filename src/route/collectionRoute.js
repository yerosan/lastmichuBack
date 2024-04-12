const express=require("express")
const router=express.Router()
const collectionController=require("../controller/collectionController")
const { col } = require("sequelize")

router.post("/add", collectionController.addColletionData)
router.get("/users/:userName", collectionController.CollectetionPerUser)
router.get("/total", collectionController.collectedAmount)
router.post("/dateRange", collectionController.totalCollectedPerDateRange)
router.delete("/deleteUser", collectionController.deleteUser)

module.exports = router;