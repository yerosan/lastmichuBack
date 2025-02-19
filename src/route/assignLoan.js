const express=require("express")
const router=express.Router()
const assignLoanControllers=require("../controller/assignLoan")
const loanStatusController=require("../controller/statusUpdator")


router.post("/assignLoans", assignLoanControllers.assignLoans)
router.post("/getAssignLoans", assignLoanControllers.getAssignedLoans)
router.post("/getUserAssignedLoans", assignLoanControllers.getUserAssignedLoans)
router.post("/getUserAssignedLoansHistory", assignLoanControllers.getUserAssignedLoansHistory)
router.put("/updateLoanStatus", loanStatusController.updateLoanStatus)


module.exports=router