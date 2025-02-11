const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
let fetch;

import('node-fetch').then(mod => {
    fetch = mod.default;
}).catch(err => console.error('Failed to load node-fetch:', err)); // Make sure to have node-fetch installed

const app = express();
const PORT = 6000; // Change this if you prefer a different port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Proxy route for /ext-login
app.post('/api/ext-login', async (req, res) => {
    try {
        const response = await fetch('https://ime.finloge.com/api/ext-login', {
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

        const response = await fetch('https://ime.finloge.com/api/ext-balance', {
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
// Proxy route for /api/ext-profile to handle PUT requests
app.get('/api/ext-profile', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        const response = await fetch('https://ime.finloge.com/api/ext-profile', {
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

        const response = await fetch('https://ime.finloge.com/api/ext-logout', {
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
        const apiUrl = `https://ime.finloge.com/api/ext-transaction?page=${page}`;

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

        const response = await fetch('https://ime.finloge.com/api/ext-transaction', {
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

// Proxy route for /api/ext-profile to handle PUT requests
app.put('/api/ext-profile', async (req, res) => {
    try {
        const authToken = req.header('Authorization');
        if (!authToken) {
            console.log('No Authorization token found in request headers.');
            return res.status(401).json({ error: 'Authorization token is required' });
        }

        // Validate request body for required field 'domain'
        if (!req.body.domain) {
            console.log('Missing "domain" field in request body.');
            return res.status(400).json({ error: 'Domain is required' });
        }

        console.log('Received PUT request to /api/ext-profile');
        console.log('Request Body:', req.body); 

        // Set the options for the fetch request to perform a PUT operation
        const options = {
            method: 'PUT',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body) 
        };

        console.log('Sending request to external API:', 'https://ime.finloge.com/api/ext-profile');
        const response = await fetch('https://ime.finloge.com/api/ext-profile', options);

        // Handle the response based on its success
        if (response.ok) {
            console.log('External API responded with success.');
            const data = await response.json();
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: data
            });
        } else {
            console.error(`Failed to update profile. Status: ${response.status}`);
            // Detailed error handling based on content type
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                console.error('Error response from external API:', errorData); 
                res.status(response.status).json(errorData);
            } else {
                const errorText = await response.text();
                console.error('Error response from external API:', errorText); 
                res.status(response.status).send(errorText);
            }
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error during profile update' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});