const express=require("express")
const router=express.Router()
const customerContactController=require("../controller/customerInteraction")


router.post("/customerContact", customerContactController.addInteraction)
router.post("/getCustomerContact", customerContactController.getInteractionsByDate)
router.post("/customerContactPerUser", customerContactController.getInteractionsByOfficerAndDate)
router.post("/notContactCustomerPerUser", customerContactController.getNotContactedInteractionsByOfficerAndDate)
router.put("/updateCustomerInteraction", customerContactController.updateInteraction)

module.exports=router