const express=require("express")
const router=express.Router()
const statisticsRouter=require("../controller/statistics")
const collectionStat=require("../controller/collectionStatistics")


router.post("/getCollectionStatistics", statisticsRouter.getCollectionStatistics)
router.post("/getOverAllCollection", collectionStat.getCollectionStatistics)


module.exports=router