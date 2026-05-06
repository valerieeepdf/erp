const axios = require('axios');

async function authRoutes(fastify, options) {
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const response = await axios.post(
        `${process.env.USER_SERVICE_URL}/auth/login`,
        request.body,
      );
      return reply.status(response.data.statusCode).send(response.data);
    } catch (err) {
      console.error('Login error:', err.message);
      console.error('Response:', err.response?.data);
      const status = err.response?.status || 500;
      const data = err.response?.data || { statusCode: 500, intOpCode: 'SxGW500', data: null };
      return reply.status(status).send(data);
    }
  });

  fastify.post('/auth/register', async (request, reply) => {
    try {
      console.log('Forwarding to:', `${process.env.USER_SERVICE_URL}/auth/register`);
      console.log('Body:', request.body);
      const response = await axios.post(
        `${process.env.USER_SERVICE_URL}/auth/register`,
        request.body,
      );
      return reply.status(response.data.statusCode).send(response.data);
    } catch (err) {
      console.error('Register error:', err.message);
      console.error('Response:', err.response?.data);
      const status = err.response?.status || 500;
      const data = err.response?.data || { statusCode: 500, intOpCode: 'SxGW500', data: null };
      return reply.status(status).send(data);
    }
  });
}

module.exports = authRoutes;