const express=require("express")
const userRoutes=require("./src/route/userRoute")
const auth=require("./src/middleware/authorization")
const predictionRouter=require("./src/route/predictRoute")
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
app.use(auth)

app.use("/user",userRoutes)
app.use("/patient",predictionRouter)

app.listen(3000, ()=>{
    console.log("app is listening in port 3000")
})