// healthcheck.js
const express = require('express');
const router = express.Router();
const { healthCheck } = require('./database');

router.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    if (dbHealth) {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'connected'
        }
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        services: {
          database: 'disconnected'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
