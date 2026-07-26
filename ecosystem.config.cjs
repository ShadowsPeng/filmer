module.exports = {
  apps: [{
    name: 'filmer-server',
    cwd: './packages/server',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '400M',
    env: { NODE_ENV: 'production' },
  }],
}
