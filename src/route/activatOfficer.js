const express=require("express")
const router=express.Router()
const officerController=require("../controller/activeOfficer")



router.post("/activeOfficer", officerController.activateOfficer)
router.post("/deactiveOfficer", officerController.deactivateOfficer)


module.exports=router