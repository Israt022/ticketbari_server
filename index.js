const dns = require('node:dns');
dns.setServers(['1.1.1.1', '1.0.0.1']); 

const express = require('express');
const cors = require("cors");
const app = express()
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion } = require('mongodb');
const { jwtVerify, createRemoteJWKSet } = require('jose-cjs');

app.use(cors());
app.use(express.json());
require('dotenv').config()

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = process.env.MONGODB_URI;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken = async(req,res,next) =>{
  const authHeader = req.headers.authorization;
  
  if(!authHeader || !authHeader.startsWith('Bearer')){
    return res.status(401).json({message : "Unauthorize"});
  }

  const token = authHeader.split(" ")[1];
  
  if(!token){
    return res.status(401).json({message : "Unauthorize"});
  }

  try{
    const {payload} = await jwtVerify(token, JWKS);
    req.user = payload;
    
    next();
  }catch(error){
    return res.status(401).json({message : "Unauthorize"});
  }
}
// Vendor verify
const vendorVerify = async(req, res, next) => {
  const user = req.user;
  
  if(user.role !== "vendor"){
    return res.status(403).json({message : "Forbidden"});
  }

  next();
};
// User verify
const userVerify = async(req,res,next) => {
  const user = req.user;
  if(user.role !== "user"){
    return res.status(403).send({message : "Forbidden access"})
  }

  next();
}
// Admin verify
const adminVerify = async(req,res,next) => {
  const user = req.user;
  if(user.role !== "admin"){
    return res.status(403).send({message : "Forbidden access"})
  }

  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db("ticket_bari");
    const userCollection = db.collection("user");
    const ticketCollection = db.collection("tickets");
    
    // Vendor Ticket add
    app.post('/vendor/tickets', verifyToken, vendorVerify, async(req,res) => {
      const data = req.body;
      const result = await ticketCollection.insertOne({
        ...data,
        userId: req.user.id,
        userName: req.user.name,
        userMail: req.user.email,
        createdAt: new Date(),
      });

      res.json(result);
    })
    // Vendor Ticket get 
    app.get('/vendor/tickets', async(req, res) => {
      const result = await ticketCollection.find().toArray();

      res.json(result);
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})