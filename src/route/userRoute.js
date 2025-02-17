const express=require("express")
const router=express.Router()
const userControllers=require("../controller/userController")
router.post("/register",userControllers.registerUser)
router.post("/login",userControllers.loginUser)
router.post("/add",userControllers.addUser)
router.get("/allUser", userControllers.getUser)
router.patch("/changePassword", userControllers.changePassword)
router.put("/resetPassword", userControllers.resetPassword)

module.exports=router