const express=require("express")
const cors=require("cors")
// const userRoutes=require("./src/route/userRoute")
// const auth=require("./src/middleware/authorization")
const predictionRouter=require("./src/route/predictRoute")
const saccosRoute=require("./src/route/saccosRoute")
const fuelRoute=require("./src/route/fuelRoute")
const coopayRoute=require("./src/route/coopayRoute")
const instituteRoute=require("./src/route/instituteRoute")
app=express()

app.use(express.json())
const cdkSequelize= require("./src/db/db")

cdkSequelize.authenticate().then(()=>{
    console.log("cdk data base is connected successfully")
    cdkSequelize.sync().then(()=>{
        console.log("db is successfully synced")
    })
}).catch(error=>{
    console.log("An internal error",error)
})

app.use(cors(), function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
}
);
// app.use(auth)

// app.use("/user",userRoutes)
app.use("/patient",predictionRouter)
app.use("/saccos",saccosRoute)
app.use("/fuel", fuelRoute)
app.use("/coopayData", coopayRoute)
app.use("/institute", instituteRoute)

app.listen(3000, ()=>{
    console.log("app is listening in port 3000")
})