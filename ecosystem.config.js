// module.exports = {
//     apps: [{
//       name: "michu",
//       script: "app.js",
//       instances: "max", // Use all available CPU cores
//       exec_mode: "cluster", // Run in cluster mode
//       watch: false, // Disable watch in production
//       max_memory_restart: "1G",
//       env: {
//         NODE_ENV: "production",
//         PORT: 3000
//       },
//       // Auto restart if app crashes
//       autorestart: true,
//       // Restart if app reaches memory threshold
//       max_restarts: 10,
//       // Delay between automatic restarts
//       restart_delay: 5000,

//        // Log configuration
//         error_file: "logs/error.log",
//         out_file: "logs/output.log",
//         merge_logs: true,
//         log_date_format: "YYYY-MM-DD HH:mm:ss"
//     }]
//   }
  

const os = require("os");

module.exports = {
  apps: [
    {
      name: "michu",
      script: "app.js",
      instances: Math.max(1, os.cpus().length - 1), // Uses (CPU count - 1) cores
      exec_mode: "cluster", // Run in cluster mode
      watch: false, // Disable watch in production
      max_memory_restart: "1G",

      env: {
        NODE_ENV: "production",
        PORT: 3000
      },

      // Auto restart if app crashes
      autorestart: true,
      max_restarts: 10,

      // Exponential backoff for restarts
      restart_delay: 5000, // Initial delay
      exp_backoff_restart_delay: 1000, // Smart restart (1s, 2s, 4s, etc.)

      // Allow graceful shutdown
      kill_timeout: 5000,

      // Log configuration
      error_file: `logs/${process.env.NODE_ENV}-error-${process.pid}.log`,
      out_file: `logs/${process.env.NODE_ENV}-output-${process.pid}.log`,
      merge_logs: false, // Keep logs separate per process
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};