const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const dns = require('dns');
const ping = require('ping');
const { exec } = require('child_process');
const { promisify } = require('util');
const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'data');
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

app.use(express.static('public'));
app.use('/css', express.static(path.join(__dirname, 'views/css')));
app.use('/js', express.static(path.join(__dirname, 'views/js')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const upload = multer({ dest: uploadDir }).single('csvFile');

// Home Page Route
app.get('/', (req, res) => {
    res.render('index'); // This will render index.ejs
});

// Upload Route (form to upload CSV)
app.get('/upload', (req, res) => {
    res.render('upload'); // This will render upload.ejs
});

// Handle CSV upload
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).send('Upload failed.');

        const filePath = req.file.path;
        const originalName = path.parse(req.file.originalname).name;
        const outputJson = path.join(outputDir, `${originalName}.json`);

        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const subdomain = row.subdomain || Object.values(row)[0];
                if (subdomain) results.push(subdomain.trim());
            })
            .on('end', () => {
                fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
                fs.unlinkSync(filePath);
                res.send(`✅ Converted to JSON: <code>${originalName}.json</code> saved.`);
            })
            .on('error', (err) => {
                console.error('CSV parse error:', err);
                res.status(500).send('Failed to parse CSV.');
            });
    });
});

// Subdomain Checker Route
app.get('/subdomain-checker', (req, res) => {
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
    res.render('subdomain-checker', { files }); // Render subdomain-checker.ejs
});

// Route to test selected JSON file
app.get('/test/:file', async (req, res) => {
    const filePath = path.join(outputDir, req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found.');

    const subdomains = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const results = [];
    let index = 0;

    // Set the interval to process one subdomain every 2 seconds
    const interval = setInterval(async () => {
        if (index >= subdomains.length) {
            clearInterval(interval);  // Stop the interval once all subdomains are processed
            return;
        }

        const sub = subdomains[index];
        const url = sub.startsWith('http') ? sub : `http://${sub}`;

        const status = {
            subdomain: url,
            http: await checkHttpStatus(url),
            dns: await checkDnsStatus(url),
            ping: await checkPingStatus(sub)
        };

        results.push(status);
        index++;

        // Emit partial results after each test
        io.emit('subdomain-test', status); // Emit to frontend via socket

    }, 2000);  // Test a subdomain every 2 seconds
});

// Check HTTP status using Axios
async function checkHttpStatus(url) {
    try {
        const response = await axios.get(url, { timeout: 5000 });
        return `HTTP: ${response.status}`; // Successful HTTP request
    } catch (err) {
        return 'HTTP: Inactive'; // Failed HTTP request
    }
}

// Check DNS resolution status
async function checkDnsStatus(subdomain) {
    return new Promise((resolve) => {
        dns.resolve4(subdomain, (err, addresses) => {
            if (err) {
                resolve('DNS: Inactive'); // DNS lookup failed
            } else {
                resolve(`DNS: Active (${addresses.join(', ')})`); // DNS lookup successful
            }
        });
    });
}

// Check Ping status
async function checkPingStatus(subdomain) {
    return new Promise((resolve) => {
        ping.promise.probe(subdomain)
            .then((res) => {
                if (res.alive) {
                    resolve(`Ping: Alive (Latency: ${res.time}ms)`); // Ping successful
                } else {
                    resolve('Ping: Inactive'); // Ping failed
                }
            })
            .catch(() => {
                resolve('Ping: Inactive'); // Ping failed
            });
    });
}

// Data Route (View JSON Files)
app.get('/data', (req, res) => {
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
    res.render('data', { files }); // Render data.ejs to display files
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
