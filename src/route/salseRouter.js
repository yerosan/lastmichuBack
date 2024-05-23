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
router.post("/addTarget", salseController.addTarget)
router.get("/users", salseController.getSalesuser)
router.post("/createDistrict", salseController.createDistrict)
router.get("/userDistrict/:userId", salseController.getDistrictPeruser)
router.get("/target", salseController.getTarget)
router.post("/givenDateTarget", salseController.getTargetPerDate)
router.post("/addDistrict", salseController.districtList)
router.get("/districtList", salseController.getDistrictList)

module.exports=router