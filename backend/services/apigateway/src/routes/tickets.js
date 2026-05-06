const axios = require('axios');

async function ticketRoutes(fastify, options) {
  const opts = { onRequest: [fastify.authenticate] };

  fastify.get('/tickets', opts, async (request, reply) => {
    try {
      const response = await axios.get(
        `${process.env.TICKETS_SERVICE_URL}/tickets`,
        {
          headers: buildHeaders(request),
          params: request.query,
        },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/tickets/:id', opts, async (request, reply) => {
    try {
      const response = await axios.get(
        `${process.env.TICKETS_SERVICE_URL}/tickets/${request.params.id}`,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.post('/tickets', opts, async (request, reply) => {
    const { user, permissions } = getAuth(request);

    if (!permissions.includes('tickets:add')) {
      return reply.status(403).send({
        statusCode: 403,
        intOpCode: 'SxGW403',
        data: null,
        message: 'No tienes permiso para crear tickets',
      });
    }

    try {
      const response = await axios.post(
        `${process.env.TICKETS_SERVICE_URL}/tickets`,
        request.body,
        { headers: buildHeaders(request) },
      );
      return reply.status(response.data.statusCode).send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.patch('/tickets/:id/status', opts, async (request, reply) => {
    const { user, permissions } = getAuth(request);

    if (!permissions.includes('tickets:move')) {
      return reply.status(403).send({
        statusCode: 403,
        intOpCode: 'SxGW403',
        data: null,
        message: 'No tienes permiso para mover tickets',
      });
    }

    try {
      const response = await axios.patch(
        `${process.env.TICKETS_SERVICE_URL}/tickets/${request.params.id}/status`,
        request.body,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.patch('/tickets/:id', opts, async (request, reply) => {
    try {
      const response = await axios.patch(
        `${process.env.TICKETS_SERVICE_URL}/tickets/${request.params.id}`,
        request.body,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.delete('/tickets/:id', opts, async (request, reply) => {
    try {
      const response = await axios.delete(
        `${process.env.TICKETS_SERVICE_URL}/tickets/${request.params.id}`,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

function getAuth(request) {
  const user = request.user;
  const groupId = request.headers['x-group-id'] || '';
  const permissions = user.permissionsByGroup?.[groupId] || [];
  return { user, permissions };
}

function buildHeaders(request) {
  const { user, permissions } = getAuth(request);
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

module.exports = ticketRoutes;