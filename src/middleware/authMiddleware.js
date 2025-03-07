// /src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    if (!token) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Tambahkan user info ke req
        next();
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
    }
};
