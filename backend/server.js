require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`👤 Users endpoint: http://localhost:${PORT}/api/users\n`);
  });
});
