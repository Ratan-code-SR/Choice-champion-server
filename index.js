const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        `${process.env.HTTP_URL}`,
        `${process.env.OPTIONAL_URL}`,
        'https://choice-champion-server.vercel.app', // Add this line

    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntqulhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const queryCollection = client.db("ChoiceChampion").collection("query");
        const recommendCollection = client.db("ChoiceChampion").collection("recommend");

        // get query data 
        app.get("/query", async (req, res) => {
            const result = await queryCollection.find().toArray();
            res.send(result)
        })

        // get recommended data 
        app.get("/recommend", async (req, res) => {
            const result = await recommendCollection.find().toArray();
            res.send(result)
        })

        // get recommendation by id
        app.get("/recommend/query_id/:query_id", async (req, res) => {
            const id = req.params.query_id;
            const query = { query_id: id };
            const result = await recommendCollection.find(query).toArray();
            res.send(result)
        })

        // get recommendation by email
        app.get("/recommend/email/:recommend_userEmail", async (req, res) => {
            const email = req.params.recommend_userEmail;
            const query = { recommend_userEmail: email };
            const result = await recommendCollection.find(query).toArray();
            res.send(result)
        })

        // delete recommend
        app.delete("/recommend/:id", async (req, res) => {
            const id = req.params.id;
            // console.log("please delete from database", id);
            const query = { _id: new ObjectId(id) };
            const result = await recommendCollection.deleteOne(query);
            res.send(result)
        })
        // get query by email
        app.get("/query/:email", async (req, res) => {
            const email = req.params.email;
            const query = { User_Email: email };
            const result = await queryCollection.find(query).toArray();
            res.send(result)
        })
        app.get("/query/id/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.findOne(query);
            res.send(result)
        })

        app.post("/query", async (req, res) => {
            const query = req.body;
            // console.log("new query", query);
            const result = await queryCollection.insertOne(query);
            res.send(result)
        })

        // update query
        app.put("/query/:id", async (req, res) => {
            const id = req.params.id;
            const updateQuery = req.body;
            console.log(id, updateQuery);
            const filter = { _id: new ObjectId(id)}
            const options = { upsert: true }
            const updateQueryDoc = {
                $set: {
                    Product_Image: updateQuery.Product_Image,
                    Query_Title: updateQuery.Query_Title,
                    Product_Name: updateQuery.Product_Name,
                    Brand_Name: updateQuery.Brand_Name,
                    Boycotting_Reason: updateQuery.Boycotting_Reason,
                    User_Name: updateQuery.User_Name,
                    User_Image: updateQuery.User_Image,
                    User_Email: updateQuery.User_Email,
                    recommendationCount: updateQuery.recommendationCount,
                    Current_Date: updateQuery.Current_Date,
                    Current_Time: updateQuery.Current_Time
                }
            }
            const result = await queryCollection.updateOne(filter, updateQueryDoc, options)
            res.send(result)
        })
        // post recommend
        app.post("/recommend", async (req, res) => {
            const query = req.body;
            console.log("new query", query);
            const result = await recommendCollection.insertOne(query);
            res.send(result)
        })

        app.delete("/query/:id", async (req, res) => {
            const id = req.params.id;
            console.log("please delete from database", id);
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.deleteOne(query);
            res.send(result)
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



app.get("/", (req, res) => {
    res.send('server is running')
})

app.listen(port, (req, res) => {
    console.log(`server is running at: http://localhost:${port}`);
})


