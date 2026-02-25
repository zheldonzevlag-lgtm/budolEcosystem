import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc='
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Verify JWT token (Edge Runtime compatible)
export async function verifyTokenEdge(token) {
    try {
        if (!token) {
            console.log('[TokenEdge] No token provided');
            return null;
        }
        
        const secret = new TextEncoder().encode(JWT_SECRET)
        console.log(`[TokenEdge] Verifying token with secret starting with: ${JWT_SECRET.substring(0, 3)}...`);
        
        const { payload } = await jwtVerify(token, secret)
        console.log(`[TokenEdge] Token verified for user: ${payload.userId || payload.sub}`);
        return payload
    } catch (error) {
        console.error('[TokenEdge] Token verification failed:', error.message)
        // Log more details if it's a signature mismatch
        if (error.code === 'ERR_JWT_SIGNATURE_VERIFICATION_FAILED') {
            console.error('[TokenEdge] Signature mismatch. Check if JWT_SECRET matches between signer and verifier.');
        }
        return null
    }
}
