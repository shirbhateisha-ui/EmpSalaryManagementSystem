process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret-min-16';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-min-16';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '7d';
process.env.CORS_ORIGIN = 'http://localhost:5173';
