require('dotenv').config();

const express = require('express');
const app = express();
const runRoute = require("./routes/run"); 

require('dotenv').config();

app.use(cors({
    origin: 'https://your-actual-vercel-domain.vercel.app'
}));

app.use(express.json());    

app.use('/',runRoute);


app.listen(3000,()=>{
    console.log('server listening on port 3000');
})
