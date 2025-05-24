const express = require('express');
const cors = require("cors");
const os = require('os');

const app = express();
const port = 3000;

app.use(cors()); // Allow all origins

app.get('/', (req, res) => {
    const response = {
        timestamp: Date.now(),
        humidity: Math.floor(Math.random() * 10) + 40,
        temperature: Math.floor(Math.random() * 10) + 30,
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

// Function to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

// Bind to 0.0.0.0 to allow network access
app.listen(port, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`Server is running on:`);
    console.log(`- Local: http://localhost:${port}`);
    console.log(`- Network: http://${localIP}:${port}`);
    console.log(`\nUse the Network URL to access from your mobile device`);
});