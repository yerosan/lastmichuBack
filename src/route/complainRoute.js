const express=require("express")
const router=express.Router()
const { col } = require("sequelize")

const complainController=require("../controller/comlainController")
const refundController=require("../controller/refundController")


router.post("/addComplain", complainController.addComplain)
router.get("/search/:search", complainController.searchData)
router.patch("/update",complainController.editComplain)
router.post("/dataPerDate", complainController.getdateRangeData)

router.post("/addRefund", refundController.addRefundData)
router.put("/updateRefund", refundController.editRefund)
router.post("/getRefundPerUser",refundController.refundDataPerUser )
router.post("/allRefund", refundController.getAllData)
router.post("/financeReport", refundController.financeDataPerUser)
router.post("/allFinance",refundController.financeReport)

module.exports=router