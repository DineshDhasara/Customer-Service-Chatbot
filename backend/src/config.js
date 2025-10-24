module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  MOCK_MODE: process.env.MOCK_MODE === 'true' || true,
};
