const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
require('dotenv').config();
var jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 5000;

//  
// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Scurekey}@cluster0.sflyv9x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db('houseHunterDb').collection('users');
    const houseCollection = client.db('houseHunterDb').collection('houses');

 // Register User

 app.post('/users', async (req, res) => {
    try {
        const {fullName, role, phoneNumber, email, password} = req.body;
        // check the email already exists
        const existingUser = await userCollection.findOne({email});
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered'})
        }
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // new user create
        const newUser = {
            fullName,
            role,
            phoneNumber,
            email,
            password: hashedPassword,
        };
        // Insert user into database
        await userCollection.insertOne(newUser);
        
        res.status(201).json({ message: 'User Registered Sucessfully!!'});
    }catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error'});
    }
 });

//  user login 

app.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
    
    // check if ther user exists
    const user = await userCollection.findOne({email});
    if (!user) {
        return res.status(401).json({ message: 'Invalid User'});
    }
    // check if the password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if(!passwordMatch) {
        return res.status(401).json({ message: 'Invalid User'});
    }
    // generate jwt token
    const token = jwt.sign({ userId: user._id, email: user.email}, process.env.JWT_Secret, { expiresIn: '2h'});
    const userInfo = {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phoneNumber: user.phoneNumber,
      };
    res.status(200).json({token, user: userInfo});
 } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
 }

});

// house owner 
app.get('/users/houseOwner/:email', async (req, res) => {
    
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);

        const result = { isHouseOwner: user.role === 'House Owner' };
        return res.json(result);
   
});

// house adding api
app.post('/addHouse', async (req, res) => {
  const newHouse = req.body;
  const result = await houseCollection.insertOne(newHouse);
  res.send(result);
})
// get my house
app.get('/houses/:phoneNumber', async (req, res) => {
  const Number = req.params.phoneNumber;
  const query = {phoneNumber: Number};
  const houses = await houseCollection.find(query).toArray();
  res.send(houses);
})
// get all Houses
app.get('/allHouses', async( req, res) => {
  const houses = houseCollection.find().limit(10);
  const result = await houses.toArray();
  res.send(result);
})
    // Send a ping to confirm a successful connection

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();

   
  }
}
run().catch(console.dir);

// Register User
app.post('/users')

app.get('/', (req, res) => {
    res.send('House Hunter is running')
})

app.listen(port, () => {
    console.log(`House Hunter is running on port, ${port}`)
})