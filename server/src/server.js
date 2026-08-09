const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const connectDB = require('./config/db');
const config = require('./config');
const { initSockets } = require('./sockets');

async function start() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: config.clientUrl, credentials: true },
  });
  app.set('io', io);
  initSockets(io);

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`Nexora ERP API running on http://0.0.0.0:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
