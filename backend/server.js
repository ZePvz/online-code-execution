const express = require('express');
const app = express();
const runRoute = require("./routes/run"); 

app.use(express.json());    

app.use('/',runRoute);


app.listen(3000,()=>{
    console.log('server listening on port 3000');
})
