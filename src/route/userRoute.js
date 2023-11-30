const express=require("express")
const router=express.Router()
const userControllers=require("../controller/userController")
router.post("/register",userControllers.registerUser)
router.get("/login",userControllers.loginUser)
router.post("/add",userControllers.addUser)


module.exports=router