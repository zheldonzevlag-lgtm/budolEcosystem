const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security and Logging
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Routes and Proxy configuration
const services = [
    {
        route: '/auth',
        target: process.env.AUTH_SERVICE_URL || 'http://localhost:8001'
    },
    {
        route: '/wallet',
        target: process.env.WALLET_SERVICE_URL || 'http://localhost:8002'
    },
    {
        route: '/transactions',
        target: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:8003'
    },
    {
        route: '/payments',
        target: process.env.PAYMENT_GATEWAY_URL || 'http://localhost:8004'
    }
];

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is healthy', timestamp: new Date() });
});

// Setup Proxies
services.forEach(({ route, target }) => {
    app.use(route, createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: {
            [`^${route}`]: '',
        },
    }));
});

app.listen(PORT, () => {
    console.log(`budolPay API Gateway running on port ${PORT}`);
});
