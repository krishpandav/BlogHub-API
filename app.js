require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes/routes.js');
const connectDB = require('./config/dbConfig');
const app = express();

// Connect to MongoDB
connectDB();

app.use(cors({
    origin: 'http://127.0.0.1:5501', // specify the exact origin
    credentials: true               // allow cookies/credentials
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', routes);

app.listen(process.env.PORT || 5051, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 5051}`);
});