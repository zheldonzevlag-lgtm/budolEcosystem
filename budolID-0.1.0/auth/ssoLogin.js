// Enhanced SSO login endpoint with dual-identifier support
const { normalizePhilippinePhone } = require('./utils/phoneNormalization');

// Enhanced SSO Login with dual-identifier support
app.post('/auth/sso/login', async (req, res) => {
    const { email, password, apiKey } = req.body;
    console.log('[SSO Login API] Attempt for:', email, 'with apiKey:', apiKey);
    
    try {
        // Verify the requesting app
        const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey } });
        if (!ecosystemApp) {
            console.log('[SSO Login API] Invalid apiKey:', apiKey);
            return res.status(403).json({ error: 'Unauthorized Application' });
        }

        // Determine if the identifier is an email or phone number
        let user;
        let identifierType;
        
        // Check if it looks like a phone number (starts with +, 0, or 9 and has digits)
        const phoneRegex = /^[\+\d]\d{9,}$/;
        const isPhoneNumber = phoneRegex.test(email) && email.includes('9');
        
        if (isPhoneNumber) {
            // Normalize phone number
            const normalizedPhone = normalizePhilippinePhone(email);
            if (!normalizedPhone) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
            
            // Find user by phone number
            user = await prisma.user.findFirst({ 
                where: { phoneNumber: normalizedPhone } 
            });
            identifierType = 'phone';
        } else {
            // Assume it's an email
            user = await prisma.user.findUnique({ 
                where: { email: email } 
            });
            identifierType = 'email';
        }

        // Verify user credentials
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log(`[SSO Login API] Invalid credentials for ${identifierType}:`, email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Ecosystem-wide JWT
        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phoneNumber: user.phoneNumber,
                iss: 'budolID',
                jti: require('crypto').randomUUID(),
                loginMethod: identifierType
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Record the session
        await prisma.session.create({
            data: {
                userId: user.id,
                appId: ecosystemApp.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        console.log(`[SSO Login API] Success for ${identifierType}:`, email);
        res.json({ 
            token, 
            redirectUri: ecosystemApp.redirectUri,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error('[SSO Login API] Error:', error);
        res.status(500).json({ error: error.message });
    }
});