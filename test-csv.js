const fs = require('fs');
const csv = require('csv-parser');

const filePath = 'F:/subdomains/aa.csv';  // Correct path to your CSV file
const results = [];

fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
        console.log('CSV Data:', data); // Log each row's data
        if (data.subdomain) {
            results.push(data.subdomain);
        }
    })
    .on('end', () => {
        console.log('Extracted Subdomains:', results);
    })
    .on('error', (err) => {
        console.error('Error reading CSV file:', err);
    });
