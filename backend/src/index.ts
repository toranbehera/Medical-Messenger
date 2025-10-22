import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { healthRoutes } from './routes/health.js';
import { doctorRoutes } from './routes/doctors.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { messageRoutes } from './routes/messages.js';
import { env } from './env.js';
import path from 'path';

const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  },
});

fastify.get('/', async (request, reply) => {
  reply.send({ message: 'Backend is running successfully 🚀' });
});

// Serve static frontend
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'), // folder containing built frontend files
});

// Add request logging
fastify.addHook('onRequest', async (request) => {
  request.log.info(
    {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    },
    'Incoming request'
  );
});

fastify.addHook('onResponse', async (request, reply) => {
  request.log.info(
    {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime(),
    },
    'Request completed'
  );
});

// Register CORS
fastify.register(cors, {
  origin: [
    'http://localhost:3000',
    'https://medmsg-frontend-static.azurewebsites.net',
  ],
  credentials: true,
});

// Socket.io server
const io = new Server(fastify.server, {
  cors: { origin: ['http://localhost:3000'], credentials: true },
});

io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  socket.on('joinRoom', (doctorId: string) =>
    socket.join(`doctor-${doctorId}`)
  );

  socket.on('sendMessage', ({ doctorId, message, sender }) => {
    io.to(`doctor-${doctorId}`).emit('receiveMessage', {
      message,
      sender,
      timestamp: new Date().toISOString(),
    });
  });
});

// Register routes
fastify.register(healthRoutes, { prefix: '' });
fastify.register(doctorRoutes, { prefix: '/api/v1' });
fastify.register(subscriptionRoutes, { prefix: '/api/v1' });
fastify.register(messageRoutes, { prefix: '/api/v1' });

// Serve index.html for any frontend route
fastify.setNotFoundHandler((req, reply) => {
  if (req.raw.url && !req.raw.url.startsWith('/api')) {
    return reply.sendFile('index.html');
  }

  return reply.status(404).send({ error: 'Not found' });
});

// Start server
const start = async (): Promise<void> => {
  try {
    const port = env.PORT;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
