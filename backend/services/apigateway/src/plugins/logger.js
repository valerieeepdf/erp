const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Yodapiglancelot1@db.gderranndelfqovozmaa.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function logRequest({ endpoint, method, userId, ip, statusCode, duration, error }) {
  try {
    await prisma.log.create({
      data: {
        endpoint,
        method,
        userId: userId || null,
        ip: ip || null,
        statusCode,
        duration: duration || null,
        error: error || null,
      },
    });

    await updateMetrics(endpoint, method, duration);
  } catch (err) {
    console.error('Error logging request:', err.message);
  }
}

async function updateMetrics(endpoint, method, duration) {
  try {
    const existing = await prisma.metric.findFirst({
      where: { endpoint, method },
    });

    if (existing) {
      const newCount = existing.requestCount + 1;
      const newAvg = ((existing.avgDuration * existing.requestCount) + (duration || 0)) / newCount;
      await prisma.metric.update({
        where: { id: existing.id },
        data: { requestCount: newCount, avgDuration: newAvg },
      });
    } else {
      await prisma.metric.create({
        data: { endpoint, method, requestCount: 1, avgDuration: duration || 0 },
      });
    }
  } catch (err) {
    console.error('Error updating metrics:', err.message);
  }
}

module.exports = { logRequest };