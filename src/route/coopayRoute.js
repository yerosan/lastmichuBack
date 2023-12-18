const express=require("express")
const router=express.Router()

const coopayRoute=require("../controller/coopayControllers")

router.post("/addData", coopayRoute.addCoopay)
router.get("/getData", coopayRoute.getCoopay)
router.get("/latestData", coopayRoute.lastCoopayData)


module.exports=router