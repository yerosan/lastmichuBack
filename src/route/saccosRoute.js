const express=require("express")
const router=express.Router()

const saccosController=require("../controller/saccosControllers")

router.post("/add", saccosController.saccosData)
router.get("/get", saccosController.getSaccos) 
router.get("/latestSaccos", saccosController.latestSaccos)

module.exports=router