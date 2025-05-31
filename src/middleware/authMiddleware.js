// /src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authMiddleware = async (req) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
        throw new Error('Unauthorized');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded; // Return user data
    } catch (error) {
        throw new Error('Invalid token');
    }
};
