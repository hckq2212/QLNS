// Simple CORS middleware used across the app
export default function corsMiddleware(req, res, next) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-refresh-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  // Optionally allow credentials if explicitly enabled in env
  if (process.env.ALLOW_CREDENTIALS === 'true') {
    // Note: when allowing credentials, Access-Control-Allow-Origin must NOT be '*'
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}
