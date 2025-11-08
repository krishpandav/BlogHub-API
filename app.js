require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path')
const fs = require('fs');
const routes = require('./routes/routes.js');
const connectDB = require('./config/dbConfig');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(cors({
    origin: 'http://localhost:4200', // specify the exact origin
    credentials: true               // allow cookies/credentials
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BlogHub API',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:5051/api',
                description: 'BlogHub Api Server',
            },
        ]
    },
    apis: [path.join(__dirname, 'routes', '*.js')],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const uploadsPath = path.join(__dirname, 'uploads'); // Adjust if uploads is elsewhere
app.use('/uploads', express.static(uploadsPath));

app.use('/api', routes);

app.listen(process.env.PORT || 5051, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 5051}`);
    console.log(`Api Document available on http://localhost:${process.env.PORT || 5051}/api-docs`);
});