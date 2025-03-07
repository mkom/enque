import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ message: 'Authorization token missing' }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return new Response(JSON.stringify({ message: 'Token is valid', user: decoded }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 401 }
    );
  }
}
