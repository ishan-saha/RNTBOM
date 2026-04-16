// const express = require('express');
// const cors = require('cors');
// const authRoutes = require('./src/routes/authRoutes');
// const userRoutes = require('./src/routes/userRoutes');
// const scanRoutes = require('./src/routes/scanRoutes');
// const path = require('path');

// const app = express();

// // Middleware
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000'],
//   credentials: true,
// }));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Health check
// app.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: '🚀 SBOM Auth API is running',
//     version: '1.0.0',
//     endpoints: {
//       auth: '/api/auth',
//       users: '/api/users',
//     },
//   });
// });

// app.get('/api/health', (req, res) => {
//   res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.method} ${req.path} not found`,
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('Unhandled error:', err);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal server error',
//   });
// });

// module.exports = app;




const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const scanRoutes = require('./src/routes/scanRoutes'); // ✅ NEW

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 SBOM API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      scans: '/api/scans', // ✅ added
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scans', scanRoutes); // ✅ NEW

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
