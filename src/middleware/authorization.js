const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
  console.log("req.path", req.path)
  if(req.path=="/user/register"){
  const tokens =req.body.token || req.query.token || req.headers["authorization"]
  console.log("this is token", tokens)

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