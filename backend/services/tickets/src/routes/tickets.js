const prisma = require('../plugins/prisma');

async function ticketRoutes(fastify, options) {
  // GET todos los tickets de un grupo
  fastify.get('/tickets', async (request, reply) => {
    const { groupId } = request.query;
    const where = groupId ? { groupId } : {};
    const tickets = await prisma.ticket.findMany({
      where,
      include: { assignee: true, group: true },
    });
    return { statusCode: 200, intOpCode: 'SxTK200', data: tickets };
  });

  // GET ticket por ID
  fastify.get('/tickets/:id', async (request, reply) => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: request.params.id },
      include: { assignee: true, group: true },
    });
    if (!ticket) {
      return reply.status(404).send({ statusCode: 404, intOpCode: 'SxTK404', data: null });
    }
    return { statusCode: 200, intOpCode: 'SxTK200', data: [ticket] };
  });

  // POST crear ticket
  fastify.post('/tickets', async (request, reply) => {
    const permissions = request.headers['x-user-permissions']
      ? JSON.parse(request.headers['x-user-permissions'])
      : [];

    if (!permissions.includes('tickets:add')) {
      return reply.status(403).send({ statusCode: 403, intOpCode: 'SxTK403', data: null });
    }

    const { title, description, priority, groupId, assignedTo } = request.body;
    const ticket = await prisma.ticket.create({
      data: { title, description, priority, groupId, assignedTo },
    });
    return reply.status(201).send({ statusCode: 201, intOpCode: 'SxTK201', data: [ticket] });
  });

  // PATCH mover estado
  fastify.patch('/tickets/:id/status', async (request, reply) => {
    const permissions = request.headers['x-user-permissions']
      ? JSON.parse(request.headers['x-user-permissions'])
      : [];

    if (!permissions.includes('tickets:move')) {
      return reply.status(403).send({ 
        statusCode: 403, 
        intOpCode: 'SxTK403', 
        data: null 
      });
    }

    const ticket = await prisma.ticket.findUnique({ 
      where: { id: request.params.id } 
    });
    
    if (!ticket) {
      return reply.status(404).send({ 
        statusCode: 404, 
        intOpCode: 'SxTK404', 
        data: null 
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: request.params.id },
      data: { status: request.body.status },
    });
    
    return { statusCode: 200, intOpCode: 'SxTK200', data: [updated] };
  });

  // PATCH actualizar ticket
  fastify.patch('/tickets/:id', async (request, reply) => {
    const ticket = await prisma.ticket.update({
      where: { id: request.params.id },
      data: request.body,
    });
    return { statusCode: 200, intOpCode: 'SxTK200', data: [ticket] };
  });

  // DELETE ticket
  fastify.delete('/tickets/:id', async (request, reply) => {
    await prisma.ticket.delete({ where: { id: request.params.id } });
    return { statusCode: 200, intOpCode: 'SxTK200', data: null };
  });
}

module.exports = ticketRoutes;