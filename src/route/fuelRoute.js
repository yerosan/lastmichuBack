const express=require("express")
const router=express.Router()

const fuelControllers=require("../controller/fuelControllers")

router.post("/add", fuelControllers.addfuel)
router.get("/getFuel", fuelControllers.getFuel)
router.get("/latestFuel", fuelControllers.latestFuel)

module.exports=router