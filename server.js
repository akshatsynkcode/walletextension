const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
let fetch;

import('node-fetch').then(mod => {
    fetch = mod.default;
}).catch(err => console.log('Failed to load node-fetch:', err)); // Make sure to have node-fetch installed

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/mobile-login', async (req, res) => {
    try {
        const response = await fetch('https://log-iam-temp.finloge.com/api/mobile-login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body) // Forward the body from the request
        });

        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data); // Forward the response from the backend API
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
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Proxy endpoint to fetch user profile
app.get('/api/user-profile', async (req, res) => {
    const authToken = req.header('Authorization');
    const cookie = req.header('Cookie');

    if (!authToken) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    try {
        const userProfileResponse = await fetch('https://log-iam-temp.finloge.com/api/user-profile/', {
            method: 'GET',
            headers: {
                'Authorization': authToken,
                'Cookie': cookie,
                'Content-Type': 'application/json'
            }
        });

        const data = await userProfileResponse.json();

        if (userProfileResponse.ok) {
            res.json(data);
        } else {
            res.status(userProfileResponse.status).json(data);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error while fetching user profile' });
    }
});

app.get('/api/wallet-balance', async (req, res) => {
    const authToken = req.header('Authorization');
    const cookie = req.header('Cookie');

    if (!authToken) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    try {
        const balanceResponse = await fetch('https://log-iam-temp.finloge.com/api/wallet-balance/', {
            method: 'GET',
            headers: {
                'Authorization': authToken,
                'Cookie': cookie
            }
        });

        if (balanceResponse.ok) {
            const data = await balanceResponse.json();
            res.json(data);
        } else {
            // Handle non-200 responses
            if (balanceResponse.headers.get('content-type')?.includes('application/json')) {
                const errorData = await balanceResponse.json();
                res.status(balanceResponse.status).json(errorData);
            } else {
                const errorData = await balanceResponse.text();
                res.status(balanceResponse.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ error: 'Internal server error while fetching wallet balance' });
    }
});
app.post('/api/mobile-logout', async (req, res) => {
    const authToken = req.header('Authorization');
    const cookie = req.header('Cookie');

    if (!authToken) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    try {
        const logoutResponse = await fetch('https://log-iam-temp.finloge.com/api/mobile-logout/', {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Cookie': cookie
            }
        });

        if (logoutResponse.ok) {
            const data = await logoutResponse.json();
            res.json(data);
        } else {
            // Handle non-200 responses
            if (logoutResponse.headers.get('content-type')?.includes('application/json')) {
                const errorData = await logoutResponse.json();
                res.status(logoutResponse.status).json(errorData);
            } else {
                const errorData = await logoutResponse.text();
                res.status(logoutResponse.status).send(errorData);
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Internal server error during logout' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
