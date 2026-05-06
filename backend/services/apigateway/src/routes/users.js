const axios = require('axios');

async function userRoutes(fastify, options) {
  const opts = { onRequest: [fastify.authenticate] };

  fastify.get('/users', opts, async (request, reply) => {
    try {
      const response = await axios.get(
        `${process.env.USER_SERVICE_URL}/users`,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/users/:id', opts, async (request, reply) => {
    try {
      const response = await axios.get(
        `${process.env.USER_SERVICE_URL}/users/${request.params.id}`,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.patch('/users/:id', opts, async (request, reply) => {
    try {
      const response = await axios.patch(
        `${process.env.USER_SERVICE_URL}/users/${request.params.id}`,
        request.body,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

function buildHeaders(request) {
  const user = request.user;
  const groupId = request.headers['x-group-id'] || '';
  const permissions = user.permissionsByGroup?.[groupId] || [];
  return {
    'x-user-id': user.sub,
    'x-user-permissions': JSON.stringify(permissions),
    'Content-Type': 'application/json',
  };
}

function handleError(err, reply) {
  const status = err.response?.status || 500;
  const data = err.response?.data || { statusCode: 500, intOpCode: 'SxGW500', data: null };
  return reply.status(status).send(data);
}

module.exports = userRoutes;