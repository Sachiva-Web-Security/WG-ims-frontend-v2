module.exports = {
  apps: [
    {
      name: 'wg-inventory',
      cwd: '/home/wavagrill-inventory/htdocs/www.inventory.wavagrill.com',
      script: 'npm',
      args: 'run start -- -p 3030',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3030,
      },
    },
  ],
};
