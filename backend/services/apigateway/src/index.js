require('dotenv').config();
const Fastify = require('fastify');
const { logRequest } = require('./plugins/logger');

const app = Fastify({ logger: true });

// Plugins
app.register(require('@fastify/cors'), { 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-group-id', 'x-user-id', 'x-user-permissions'],
});
app.register(require('./plugins/jwt'));
app.register(require('./plugins/rateLimit'));

// Hook para logging de cada request
app.addHook('onResponse', async (request, reply) => {
  const duration = Math.round(reply.elapsedTime);
  const userId = request.user?.sub || null;

  await logRequest({
    endpoint: request.url,
    method: request.method,
    userId,
    ip: request.ip,
    statusCode: reply.statusCode,
    duration,
    error: null,
  });
});

// Hook para logging de errores
app.addHook('onError', async (request, reply, error) => {
  const userId = request.user?.sub || null;

  await logRequest({
    endpoint: request.url,
    method: request.method,
    userId,
    ip: request.ip,
    statusCode: reply.statusCode || 500,
    duration: null,
    error: `${error.message}\nStack: ${error.stack || 'No stack trace'}`,
  });
});

// Manejador global de errores
app.setErrorHandler(async (error, request, reply) => {
  const userId = request.user?.sub || null;

  await logRequest({
    endpoint: request.url,
    method: request.method,
    userId,
    ip: request.ip,
    statusCode: error.statusCode || 500,
    duration: null,
    error: `${error.message}\nStack: ${error.stack || 'No stack trace'}`,
  });

  reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    intOpCode: 'SxGW500',
    data: null,
    message: error.message || 'Internal Server Error',
  });
});

// Routes
app.register(require('./routes/auth'));
app.register(require('./routes/groups'));
app.register(require('./routes/tickets'));
app.register(require('./routes/users'));

// Health check
app.get('/health', async () => {
  return { statusCode: 200, intOpCode: 'SxGW200', data: [{ status: 'ok' }] };
});

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await app.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`API Gateway running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();