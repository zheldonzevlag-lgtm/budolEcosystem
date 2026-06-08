import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required')
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Verify JWT token (Edge Runtime compatible)
export async function verifyTokenEdge(token) {
    try {
        if (!token) {
            return null;
        }
        
        if (!JWT_SECRET) return null;
        
        const secret = new TextEncoder().encode(JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)
        return payload
    } catch (error) {
        return null
    }
}
