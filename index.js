const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://choicechampion-d3308.web.app',
        'choicechampion-d3308.firebaseapp.com',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())



app.get("/", (req, res) => {
    res.send('server is running')
})

app.listen(port, (req, res) => {
    console.log(`server is running at: http://localhost:${port}`);
})


