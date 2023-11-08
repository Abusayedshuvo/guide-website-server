const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middle Ware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hsewnp0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Middlewares

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "UnAuthorized Access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const servicesCollection = client
      .db("assignment11DB")
      .collection("services");

    const bookCollection = client.db("assignment11DB").collection("book");
    const contactCollection = client.db("assignment11DB").collection("contact");

    // JWT Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "3h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // require("crypto").randomBytes(64).toString('hex')

    app.get("/services", async (req, res) => {
      try {
        const { limit = 4 } = req.query;
        const result = await servicesCollection
          .find()
          .limit(Number(limit))
          .toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/services-all", async (req, res) => {
      try {
        const size = parseInt(req.query.limit);
        const { limit = size } = req.query;
        const result = await servicesCollection
          .find()
          .limit(Number(limit))
          .toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await servicesCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/my-services/:id", verifyToken, async (req, res) => {
      try {
        if (req.user.email !== req.params.id) {
          return res.status(403).send({ message: "Forbidden Access" });
        }
        const userEmail = req.params.id;
        const query = { userEmail: userEmail };
        const result = await servicesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/services", async (req, res) => {
      try {
        const service = req.body;
        const result = await servicesCollection.insertOne(service);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.put("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const option = { upsert: true };
        const updateServices = req.body;
        const services = {
          $set: {
            serviceName: updateServices.serviceName,
            serviceImage: updateServices.serviceImage,
            userName: updateServices.userName,
            userEmail: updateServices.userEmail,
            userPhoto: updateServices.userPhoto,
            price: updateServices.price,
            area: updateServices.area,
            serviceDescription: updateServices.serviceDescription,
          },
        };
        const result = await servicesCollection.updateOne(
          filter,
          services,
          option
        );
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.delete("/services-all/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await servicesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/book", async (req, res) => {
      try {
        const book = req.body;
        const result = await bookCollection.insertOne(book);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/book/:id", verifyToken, async (req, res) => {
      try {
        if (req.user.email !== req.params.id) {
          return res.status(403).send({ message: "Forbidden Access" });
        }
        const userEmail = req.params.id;
        const query = { userEmail: userEmail };
        const result = await bookCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/contact", async (req, res) => {
      try {
        const contact = req.body;
        const result = await contactCollection.insertOne(contact);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Side is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// require("crypto").randomBytes(64).toString('hex')
