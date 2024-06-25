module.exports = {
    apps: [
      {
        name: 'Back_Miro',
        script: 'index.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'production',
        }
      }
    ]
  };
  