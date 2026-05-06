const fp = require('fastify-plugin');
const jwt = require('@fastify/jwt');

module.exports = fp(async function(fastify) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'erpjir_secret_key_2024',
  });

  fastify.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        statusCode: 401,
        intOpCode: 'SxGW401',
        data: null,
      });
    }
  });
});