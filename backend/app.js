 


const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const scanRoutes = require('./src/routes/scanRoutes'); // ✅ NEW
const adminSettingsRoutes = require('./src/routes/adminSettingsRoutes');
const firewallAssessmentRoutes = require('./src/routes/firewallAssessmentRoutes');
const benchmarkRoutes = require('./src/routes/benchmarkRoutes');
const configurationRoutes = require('./src/routes/configurationRoutes');
const complianceRoutes = require('./src/routes/complianceRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const exportRoutes = require('./src/routes/exportRoutes');

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

// ✅ Serve built frontend in production (placed before routes so static assets bypass them)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

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
app.use('/api/admin', adminSettingsRoutes);
app.use('/api/firewall-assessment', firewallAssessmentRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/exports', exportRoutes);

const { protect } = require('./src/middleware/auth');
const { body } = require('express-validator');
const validate = require('./src/middleware/validate');
const { runComplianceScan } = require('./src/controllers/complianceController');

app.post('/api/scans/run', protect, [
  body('benchmarkId').notEmpty().isMongoId(),
  body('parsedConfigurationId').notEmpty().isMongoId(),
], validate, runComplianceScan);

// ✅ SPA catch-all: serve index.html for any non-API client-side route in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

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
