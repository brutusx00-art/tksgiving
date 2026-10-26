const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = '/data/dishes.json';
const COCKTAIL_FILE = '/data/cocktails.json';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

// Request Logging
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    fs.appendFile('/data/debug.log', log, (err) => {
        if (err) console.error('Logging failed', err);
    });
    next();
});

// Ensure /data directory exists
const dataDir = '/data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Initialize cocktails file if it doesn't exist
if (!fs.existsSync(COCKTAIL_FILE)) {
    fs.writeFileSync(COCKTAIL_FILE, JSON.stringify([]));
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
    const { name, dish, category } = req.body;
    if (!name || !dish || !category) {
        return res.status(400).json({ error: 'Name, dish, and category are required' });
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
            category,
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

app.delete('/api/dishes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid dish ID' });
    }

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let dishes = JSON.parse(data);
        const index = dishes.findIndex(d => d.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Dish not found' });
        }

        dishes.splice(index, 1);

        fs.writeFile(DATA_FILE, JSON.stringify(dishes, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.json({ success: true });
        });
    });
});

// ==================== Cocktail Routes ====================

app.get('/api/cocktails', (req, res) => {
    fs.readFile(COCKTAIL_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        res.json(JSON.parse(data));
    });
});

app.post('/api/cocktails', (req, res) => {
    const { name, cocktailName, ingredients } = req.body;
    if (!name || !cocktailName || !ingredients) {
        return res.status(400).json({ error: 'Name, cocktail name, and ingredients are required' });
    }

    fs.readFile(COCKTAIL_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        const cocktails = JSON.parse(data);
        const newCocktail = {
            id: Date.now(),
            name,
            cocktailName,
            ingredients,
            timestamp: new Date().toISOString()
        };
        cocktails.push(newCocktail);

        fs.writeFile(COCKTAIL_FILE, JSON.stringify(cocktails, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.status(201).json(newCocktail);
        });
    });
});

app.delete('/api/cocktails/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid cocktail ID' });
    }

    fs.readFile(COCKTAIL_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let cocktails = JSON.parse(data);
        const index = cocktails.findIndex(c => c.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Cocktail not found' });
        }

        cocktails.splice(index, 1);

        fs.writeFile(COCKTAIL_FILE, JSON.stringify(cocktails, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.json({ success: true });
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