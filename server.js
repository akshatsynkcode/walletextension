const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
let fetch;

import('node-fetch').then(mod => {
    fetch = mod.default;
}).catch(err => console.error('Failed to load node-fetch:', err)); // Make sure to have node-fetch installed

const app = express();
const PORT = 3000; // Change this if you prefer a different port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Proxy route for /ext-login
app.post('/api/ext-login', async (req, res) => {
    try {
        const response = await fetch('https://ime.dubaicustoms.network/api/ext-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body) // Forward the body from the incoming request
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error during login proxy:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Proxy route for /ext-balance
app.get('/api/ext-balance', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch('https://ime.dubaicustoms.network/api/ext-balance', {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Internal server error during balance fetch' });
    }
});

// Proxy route for /ext-profile
app.get('/api/ext-profile', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch('https://ime.dubaicustoms.network/api/ext-profile', {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error during profile fetch' });
    }
});

// Proxy route for /ext-logout
app.get('/api/ext-logout', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch('https://ime.dubaicustoms.network/api/ext-logout', {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Internal server error during logout' });
    }
});

// Proxy route for /ext-transaction with pagination support
app.get('/api/ext-transaction', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        // Extract page number from the query parameters
        const page = req.query.page || 1; // Default to page 1 if not provided

        // Add page parameter to the API URL
        const apiUrl = `https://ime.dubaicustoms.network/api/ext-transaction?page=${page}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error during transactions fetch' });
    }
});

// Proxy route for updating /ext-transaction
app.put('/api/ext-transaction', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch('https://ime.dubaicustoms.network/api/ext-transaction', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify(req.body) // Forward the body from the incoming request
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Internal server error during transaction update' });
    }
});

app.get('/api/ext-transaction-count', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        // Add a filter query parameter
        const filterQuery = 'count'; // As specified in your curl command to always use 'count'

        // Construct the full API URL with the query parameter
        const apiUrl = `https://ime.dubaicustoms.network/api/ext-transaction?filter=${filterQuery}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Authorization': authToken,
                'Content-Type': 'application/json',
                'Cookie': 'csrftoken=S5PcdDgSrNo0FW7ZLBuBobHoWeCplg0d; csrftoken=S5PcdDgSrNo0FW7ZLBuBobHoWeCplg0d'
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            // Detailed error handling based on the content type in the response header
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error fetching transaction count:', error);
        res.status(500).json({ error: 'Internal server error during transaction count fetch' });
    }
});

app.get('/api/ext-check-auth', async (req, res) => {
    try {
        // Extract email from query parameters
        const email = encodeURIComponent(req.query.email);

        // Construct the URL with query parameters
        const apiUrl = `https://ime.dubaicustoms.network/api/ext-check-auth?email=${email}`;

        // Retrieve the cookie from the incoming request's headers, if available
        const cookie = req.headers['cookie'];

        // Prepare headers for the external API request
        const headers = {
            'Authorization': req.header('Authorization'),
            'Content-Type': 'application/json'
        };

        // Include cookie in headers if present
        if (cookie) {
            headers['Cookie'] = cookie;
        }

        // Perform the fetch request to the external API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers
        });

        // Check if the response was ok
        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            // Handle non-200 responses
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                res.status(response.status).json(errorData);
            } else {
                const errorData = await response.text();
                res.status(response.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error during auth check:', error);
        res.status(500).json({ error: 'Internal server error during auth check' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});