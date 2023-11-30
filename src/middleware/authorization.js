const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
  console.log("req.path", req.path)
//   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6IjA5MTIxMjEyMTMiLCJpYXQiOjE2OTc4NTk0MTQsImV4cCI6MTY5Nzk0NTgxNH0.rb_gBKGvrvzEPuYNSiOPCW7MnY8rPlfQyyFV-MWGfzY
  if(req.path=="/user/register"){
  const tokens =req.body.token || req.query.token || req.headers["authorization"]
  console.log("this is token", tokens)
//   const tokken=req.headers.authorization
  if (!tokens) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const token=tokens.split(" ")[1]
    console.log("this is security key", process.env.security_key)
    const decoded = jwt.verify(token, process.env.security_key);
    console.log("this is decoded", decoded)
    req.user = decoded;
    console.log("req.user",req.user)
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
}
  return next();
};

module.exports = verifyToken;