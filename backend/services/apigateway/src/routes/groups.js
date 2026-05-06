const axios = require('axios');

async function groupRoutes(fastify, options) {
  const opts = { onRequest: [fastify.authenticate] };

  fastify.post('/groups/setup', async (request, reply) => {
    try {
      const response = await axios.post(
        `${process.env.GROUPS_SERVICE_URL}/groups/setup`,
        request.body,
      );
      return reply.status(response.data.statusCode).send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/groups', opts, async (request, reply) => {
    try {
      const response = await axios.get(
        `${process.env.GROUPS_SERVICE_URL}/groups`,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/groups/user/:userId', opts, async (request, reply) => {
    try {
      const response = await axios.get(
        `${process.env.GROUPS_SERVICE_URL}/groups/user/${request.params.userId}`,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.post('/groups', opts, async (request, reply) => {
    const { permissions } = getAuth(request);

    if (!permissions.includes('groups:manage')) {
      return reply.status(403).send({
        statusCode: 403,
        intOpCode: 'SxGW403',
        data: null,
        message: 'No tienes permiso para gestionar grupos',
      });
    }

    try {
      const response = await axios.post(
        `${process.env.GROUPS_SERVICE_URL}/groups`,
        request.body,
        { headers: buildHeaders(request) },
      );
      return reply.status(response.data.statusCode).send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.patch('/groups/:id', opts, async (request, reply) => {
    const { permissions } = getAuth(request);

    if (!permissions.includes('groups:manage')) {
      return reply.status(403).send({
        statusCode: 403,
        intOpCode: 'SxGW403',
        data: null,
        message: 'No tienes permiso para gestionar grupos',
      });
    }

    try {
      const response = await axios.patch(
        `${process.env.GROUPS_SERVICE_URL}/groups/${request.params.id}`,
        request.body,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.delete('/groups/:id', opts, async (request, reply) => {
    const { permissions } = getAuth(request);

    if (!permissions.includes('groups:manage')) {
      return reply.status(403).send({
        statusCode: 403,
        intOpCode: 'SxGW403',
        data: null,
        message: 'No tienes permiso para gestionar grupos',
      });
    }

    try {
      const response = await axios.delete(
        `${process.env.GROUPS_SERVICE_URL}/groups/${request.params.id}`,
        { headers: buildHeaders(request) },
      );
      return reply.send(response.data);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.post('/groups/assign', opts, async (request, reply) => {
    const { permissions } = getAuth(request);

    if (!permissions.includes('groups:manage')) {
      return reply.status(403).send({
        statusCode: 403,
        intOpCode: 'SxGW403',
        data: null,
        message: 'No tienes permiso para asignar usuarios a grupos',
      });
    }

    try {
      const response = await axios.post(
        `${process.env.GROUPS_SERVICE_URL}/groups/assign`,
        request.body,
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

  const headerPermissions = request.headers['x-user-permissions'];
  let permissions = [];

  if (headerPermissions) {
    try {
      permissions = JSON.parse(headerPermissions);
    } catch (e) {
      permissions = user.permissionsByGroup?.[groupId] || [];
    }
  } else {
    permissions = user.permissionsByGroup?.[groupId] || [];
  }

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

module.exports = groupRoutes;