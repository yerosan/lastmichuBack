const express=require("express")
router=express.Router()
const predict=require("../controller/predictionController")

router.post("/predict",predict.predictedData)
router.get("/data",predict.getData)
router.get("/statistics",predict.patientStatus)
router.get("/perTarget/:target",predict.patientPer_class)

module.exports=router