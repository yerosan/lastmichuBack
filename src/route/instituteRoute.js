const express=require("express")
const router=express.Router()

const instituteRoute=require("../controller/institutionControllers")

router.post("/addInstitute", instituteRoute.addInstitute)
router.get("/getInstitute", instituteRoute.getInstitute)
router.get("/latestInstitute", instituteRoute.lastInstituteData)

module.exports=router