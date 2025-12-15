const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'dishes.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

// Request Logging
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    fs.appendFile(path.join(__dirname, 'debug.log'), log, (err) => {
        if (err) console.error('Logging failed', err);
    });
    next();
});

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Routes
app.get('/api/dishes', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        res.json(JSON.parse(data));
    });
});

app.post('/api/dishes', (req, res) => {
    const { name, dish } = req.body;
    if (!name || !dish) {
        return res.status(400).json({ error: 'Name and dish are required' });
    }

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        const dishes = JSON.parse(data);
        const newDish = {
            id: Date.now(),
            name,
            dish,
            timestamp: new Date().toISOString()
        };
        dishes.push(newDish);

        fs.writeFile(DATA_FILE, JSON.stringify(dishes, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.status(201).json(newDish);
        });
    });
});

// Start Server with Auto-Port Discovery
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(PORT);
