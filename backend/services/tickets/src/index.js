require('dotenv').config();
const Fastify = require('fastify');
const ticketRoutes = require('./routes/tickets');

const fastify = Fastify({ logger: true });

fastify.register(require('@fastify/cors'), { origin: '*' });

fastify.register(ticketRoutes);

fastify.get('/health', async () => {
  return { statusCode: 200, intOpCode: 'SxTK200', data: [{ status: 'ok' }] };
});

const start = async () => {
  try {
    const port = process.env.PORT || 3003;
    await fastify.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`Tickets service running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();