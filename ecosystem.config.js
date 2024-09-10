module.exports = {
    apps: [
      {
        name: 'Back_Miro',
        script: 'index.js',
        instances: 'max',
        exec_mode: 'cluster',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'production',
        }
      }
    ]
  };
  