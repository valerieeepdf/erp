const fp = require('fastify-plugin');
const rateLimit = require('@fastify/rate-limit');

module.exports = fp(async function(fastify) {
  fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      intOpCode: 'SxGW429',
      data: null,
      message: 'Too many requests',
    }),
  });
});