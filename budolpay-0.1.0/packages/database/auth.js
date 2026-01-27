const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
const { hasPermission } = require('./rbac-config');

/**
 * Shared Authentication Middleware
 * Compliance: BSP Circular 808
 */

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        // Check if path allows anonymous access (like health checks)
        if (req.path.endsWith('/health')) {
            return next();
        }
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Authentication required. No token provided.',
            compliance_alert: 'Unauthorized access attempts are logged under BSP standards.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error(`[Auth] Token verification failed: ${err.message}`);
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Invalid or expired token.',
            compliance_alert: 'Token failure detected. Potential security incident logged.'
        });
    }
};

const authorize = (permission) => {
    return (req, res, next) => {
        if (!req.user || !hasPermission(req.user.role, permission)) {
            console.warn(`[RBAC] Access Denied: User ${req.user?.userId} (Role: ${req.user?.role}) attempted to access resource requiring ${permission}`);
            return res.status(403).json({ 
                error: 'Forbidden', 
                message: 'You do not have permission to perform this action.',
                required_permission: permission
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    authorize
};
