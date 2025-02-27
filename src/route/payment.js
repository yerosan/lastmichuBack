const express=require("express")
const router=express.Router()
const customerContactController=require("../controller/payement")


router.post("/paiedCustomer", customerContactController.addPayment)
router.post("/getpaiedCustomer", customerContactController.getPaymentsByDate)
router.post("/customerPaidPerUser", customerContactController.getPaymentsByOfficerAndDate)
router.put("/updateCustomerPayment", customerContactController.updatePayment)
router.post("/gettodaysPayments", customerContactController.gettodaysPaymentsByOfficer)

module.exports=router