const operationalController=require("../controller/operationalController")
const express= require("express")
const router=express.Router()

router.post("/approvalData", operationalController.addOperationalData)
router.post("/givenDateData", operationalController.getOperationalData)
router.post("/userData", operationalController.getOperationalDataPerUser)
router.get("/userLiveData/:userid", operationalController.getUserLiveData)
router.patch("/operationaUpdate", operationalController.updateOperationalData)
router.delete("/deleteData/:operationalId", operationalController.deleteOperationalData)
router.post("/totalData", operationalController.totalApprovalDashboard)
router.post("/totalApprovalPerUser", operationalController.getOperationalDataPerUserTotal)
router.post("/userStatus", operationalController.OperationalDataPerUser)
router.post("/singleUserStatus", operationalController.UserOperationalData)

module.exports = router
