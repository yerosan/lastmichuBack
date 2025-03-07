const express=require("express")
const router=express.Router()
const customerContactController=require("../controller/customerInteraction")


router.post("/customerContact", customerContactController.addInteraction)
router.post("/getCustomerContact", customerContactController.getInteractionsByDate)
router.post("/customerContactPerUser", customerContactController.getInteractionsByOfficerAndDate)
router.post("/notContactCustomerPerUser", customerContactController.getNotContactedInteractionsByOfficerAndDate)
router.put("/updateCustomerInteraction", customerContactController.updateInteraction)
router.post("/getNotContactedCustomer", customerContactController.getNotContactedInteractions)
router.post("/getContactedCustomer", customerContactController.getContactedInteractions)
router.post("/promisedCustomer", customerContactController.promiseTopay)

module.exports=router