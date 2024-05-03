const express=require("express")
const salseController=require("../controller/salseController")
const SalseModel = require("../models/salseModel")

router=express.Router()

router.post("/addSalse", salseController.addSalseData)
router.post("/getData", salseController.getSalseData)
router.patch("/update", salseController.updateData)
router.delete("/delete", salseController.deleteData)
router.post("/total", salseController.totalSales)
router.post("/salsePerUser", salseController.incomePeruser)
router.post("/salsePerformance", salseController.getSalsePerUser)
router.post("/userSalse", salseController.usersSalse)

module.exports=router