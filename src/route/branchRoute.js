const { Model } = require("sequelize")
const branchController=require("../controller/branchDistrict")
const router=require("express").Router()

router.get("/branchDistrict", branchController.getBranchDistrict)

module.exports=router

