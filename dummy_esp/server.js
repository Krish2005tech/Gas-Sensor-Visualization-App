const express = require('express');
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors()); // Allow all origins

app.get('/', (req, res) => {
    const response = {
        timestamp: Date.now(),
        values: [
            Math.floor(Math.random() * 10) + 450,
            Math.floor(Math.random() * 10) + 500,
            Math.floor(Math.random() * 10) + 600,
            // Math.floor(Math.random() * 10) + 900,
            Math.floor(Math.random() * 10) + 700
        ]
    };
    console.log(response);
    res.json(response);
});

// Bind to 0.0.0.0 to allow network access
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});
