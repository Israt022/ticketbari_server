const dns = require('node:dns');
dns.setServers(['1.1.1.1', '1.0.0.1']); 

const express = require('express');
const cors = require("cors");
const app = express()
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // console.log(payload);
    req.user = payload;
    
    next();
  }catch(error){
    return res.status(401).json({message : "Unauthorize"});
  }
}
// Vendor verify
const vendorVerify = async(req, res, next) => {
  const user = req.user;
  
  if(user.userRole !== "vendor"){
    return res.status(403).json({message : "Forbidden"});
  }

  next();
};
// User verify
const userVerify = async(req,res,next) => {
  const user = req.user;
  if(user.userRole !== "user"){
    return res.status(403).send({message : "Forbidden access"})
  }

  next();
}
// Admin verify
const adminVerify = async(req,res,next) => {
  const user = req.user;
  if(user.userRole !== "admin"){
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
    
    // get users 
    app.get('/users',async(req,res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();

      res.json(result)
    })
    // fraud user 
    app.patch("/admin/users/fraud/:id", verifyToken, adminVerify, async (req, res) => {
        const { id } = req.params;
        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },  
          {
            $set: {
              isFraud: true
            }
          }
        );

        // Hide all vendor tickets
        await ticketCollection.updateMany(
          { userId: id },
          {
            $set: {
              hidden: true
            }
          }
        );

        res.json(result);
      }
    );

    // Vendor Ticket add
    app.post('/vendor/tickets', verifyToken, vendorVerify, async(req,res) => {
      const vendor = await userCollection.findOne({
        id: req.user.id,
      });

      if (vendor?.isFraud) {
        return res.status(403).json({
          message: "Fraud vendors cannot add tickets",
        });
      }
      
      const data = req.body;
      const result = await ticketCollection.insertOne({
        ...data,
        status: "pending",  
        isAdvertised: false, 
        userId: req.user.id,
        userName: req.user.name,
        userMail: req.user.email,
        createdAt: new Date(),
      });

      res.json(result);
    })
    // Admin Ticket get 
    app.get('/admin/tickets', verifyToken, adminVerify , async(req, res) => {
      const result = await ticketCollection.find().toArray();

      res.json(result);
    })

    // Admin Approve Ticket 
    app.patch('/admin/tickets/approve/:id', verifyToken, adminVerify, async (req, res) => {
      const { id } = req.params;

      const result = await ticketCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "approved" } }
      );

      res.json(result);
    });

    // Admin Reject Ticket 
    app.patch('/admin/tickets/reject/:id', verifyToken, adminVerify, async (req, res) => {
      const { id } = req.params;

      const result = await ticketCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "rejected" } }
      );

      res.json(result);
    });

    // Vendor Ticket get by user id 
    app.get('/vendor/my/tickets',verifyToken, vendorVerify, async(req, res) => {
      const userId = req.user.id;

      const result = await ticketCollection.find({ userId }).toArray();

      res.json(result);
    })

     // Patch ticket 
    app.patch('/vendor/my/tickets/:id', verifyToken, vendorVerify,async(req, res) => {
      const {id} = req.params;
      const updateData = req.body;
       // 1. get ticket 
      const ticket = await ticketCollection.findOne({
        _id: new ObjectId(id),
        userId: req.user.id
      });

      //  2. rejected 
      if (ticket?.status === "rejected") {
        return res.status(403).json({
          message: "Rejected ticket cannot be updated"
        });
      }

      // console.log(updateData);
      // 3.update 
      const result = await ticketCollection.updateOne(
        {
          _id : new ObjectId(id),
          userId: req.user.id 
        },
        {$set : updateData}
      )

      res.json(result)
    })

    // ticket delete 
    app.delete('/vendor/my/tickets/:id', verifyToken, vendorVerify, async(req,res) =>{
      const {id} = req.params;
      const result = await ticketCollection.deleteOne({_id : new ObjectId(id)})

      res.json(result);
    })

    // Admin advertise 
    app.patch("/admin/tickets/advertise/:id",verifyToken, adminVerify, async(req, res) => {
      const {id} = req.params;

      const ticket = await ticketCollection.findOne({
        _id : new ObjectId(id) 
      });

      if(!ticket){
        return res.status(404).json({
          message : 'Ticket not found',
        });
      }

      // limit 
      if (!ticket.isAdvertised) {

        const count = await ticketCollection.countDocuments({
          isAdvertised: true,
        });

        if (count >= 6) {
          return res.status(400).json({
            message: "Maximum 6 tickets can be advertised",
          });
        }
      }

      const result = await ticketCollection.updateOne(
        {
          _id : new ObjectId(id),
        },
        {
          $set : {
            isAdvertised: !ticket.isAdvertised,
          }
        }
      );

      res.json(result);
    })

    // get public ticket 
    app.get('/tickets', async (req, res) => {
      const result = await ticketCollection.find({ status: "approved" }).toArray();
      res.json(result);
    });

    // get pets data by ID
    app.get('/tickets/:ticketId', verifyToken, async(req,res)=>{
      // console.log(req.user);
        const {ticketId} = req.params;
        const query = {_id : new ObjectId(ticketId)}
        const result = await ticketCollection.findOne(query);

        res.json(result);
    })

    // get advertise ticket 
    app.get('/advertise/tickets', async (req, res) => {
      const result = await ticketCollection.find({ status: "approved", isAdvertised: true }).toArray();
      res.json(result);
    });


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