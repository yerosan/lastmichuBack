const express=require("express")
const roleController=require("../controller/roleController")
router=express.Router()


router.post("/create", roleController.addRole )
router.patch("/update", roleController.updateRole)
router.get("/perUser/:userName", roleController.rolePerUser)
router.get("/collectionUser", roleController.collectionRole)

module.exports=router