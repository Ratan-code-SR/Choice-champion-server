const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        `${process.env.HTTP_URL}`,
        `${process.env.OPTIONAL_URL}`,
        'https://choice-champion-server.vercel.app',

    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntqulhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// my middleware

const logger = (req, res, next) => {
    console.log("log: information -->", req.method, req.url);
    next();
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log('verified token -->',token);
    if (!token) {
        return res.status(401).send({ message: "unauthorized" })
    }

    jwt.verify(token, process.env.TOKEN_SECRET_API, (error, decoded) => {
        if (error) {
            res.status(401).send({ message: "unauthorized" })
        }
        req.user = decoded

        next()
    })

}
async function run() {
    try {

        const queryCollection = client.db("ChoiceChampion").collection("query");
        const recommendCollection = client.db("ChoiceChampion").collection("recommend");
        const reviewCollection = client.db("ChoiceChampion").collection("reviews");
        // auth related api
        // jwt
        app.post('/jwt', logger, (req, res) => {
            const user = req.body;
            // console.log('user token', user);
            const token = jwt.sign(user, process.env.TOKEN_SECRET_API, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
            res.send({ success: true })
        })

        app.post('/logout', (req, res) => {
            const user = req.body;
            console.log('logout user', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })

        })


        // query related api

        // get query data 
        app.get("/query", async (req, res) => {
            // console.log('cookie',req.cookies);
            const result = await queryCollection.find().toArray();
            res.send(result)
        })

        app.get("/all-queries",logger, verifyToken, async (req, res) => {
            // console.log(req.query);
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const search = req.query.search;
            let query = {
                Product_Name: { $regex: search, $options: 'i' },
            }
            //   console.log(search);
            const result = await queryCollection.find(query)
                // .skip(page > 0 ? (page - 1) * size : 0)
                .skip(page * size )
                .limit(size)
                .toArray();
            res.send(result)
        })

        app.get("/queryCount", async (req, res) => {
            const count = await queryCollection.countDocuments()
            res.send({ count })
        })
        // get recommended data 
        app.get("/recommend", async (req, res) => {
            const result = await recommendCollection.find().toArray();
            res.send(result)
        })

        // get review
        app.get("/reviews", async (req, res) => {
            const result = await reviewCollection.find().toArray();
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
            const recommendation = await recommendCollection.findOne({ _id: new ObjectId(id) });
            const queryId = recommendation.query_id;

            // Delete the recommendation
            const result = await recommendCollection.deleteOne({ _id: new ObjectId(id) });

            const updateDoc = {
                $inc: { recommendationCount: -1 },
            };
            const recommendQuery = { _id: new ObjectId(queryId) };
            const updateRecommendCount = await queryCollection.updateOne(recommendQuery, updateDoc);
            console.log(updateRecommendCount);
            res.send(result);
        })

        // get query by email
        app.get("/query/:email", logger, verifyToken, async (req, res) => {
            // console.log('set cookies email-->',req.cookies);
            // console.log(req.params.email);
            if (req.user.email !== req.params.email) {
                return res.status(403).send({ message: "not access" })
            }
            const email = req.params.email;
            const query = { User_Email: email };
            const result = await queryCollection.find(query).toArray();
            res.send(result)
        })
        app.get("/query/id/:id", logger, verifyToken, async (req, res) => {
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
        app.put("/query/:id",  async (req, res) => {
            const id = req.params.id;
            const updateQuery = req.body;
            // console.log(id, updateQuery);
            const filter = { _id: new ObjectId(id) }
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
            const id = query.query_id;
            console.log('idd-->', id);
            const result = await recommendCollection.insertOne(query);
            const updateDoc = {
                $inc: { recommendationCount: 1 },
            }
            const recommendQuery = { _id: new ObjectId(id) }
            const updateRecommendCount = await queryCollection.updateOne(recommendQuery, updateDoc)
            console.log(updateRecommendCount)
            res.send(result)
        })

        app.delete("/query/:id", async (req, res) => {
            const id = req.params.id;
            console.log("please delete from database", id);
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.deleteOne(query);
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send('server is running')
})

app.listen(port, (req, res) => {
    console.log(`server is running at: http://localhost:${port}`);
})


