# API Gateway — ERPJir

Punto único de entrada para todos los microservicios del sistema ERPJir. Construido con **Fastify**.

## Puerto
`3000`

## Tecnologías
- Fastify
- @fastify/jwt
- @fastify/cors
- @fastify/rate-limit
- Prisma (logs y métricas)
- PostgreSQL (Supabase)

## Responsabilidades
- Validación de token JWT en cada request
- Verificación de permisos por endpoint
- Rate limiting (100 req/min por IP)
- Logging centralizado en BD
- Métricas de requests en BD
- Proxy hacia microservicios

## Variables de entorno
```env
PORT=3000
JWT_SECRET=erpjir_secret_key_2024
USER_SERVICE_URL=http://localhost:3001
GROUPS_SERVICE_URL=http://localhost:3002
TICKETS_SERVICE_URL=http://localhost:3003
DATABASE_URL=postgresql://...
```

## Endpoints protegidos
| Método | Endpoint | Permiso requerido |
|--------|----------|------------------|
| POST | /tickets | tickets:add |
| PATCH | /tickets/:id/status | tickets:move |
| POST | /groups | groups:manage |
| PATCH | /groups/:id | groups:manage |
| DELETE | /groups/:id | groups:manage |
| POST | /groups/assign | groups:manage |

## Endpoints públicos
| Método | Endpoint |
|--------|----------|
| POST | /auth/login |
| POST | /auth/register |

## Instalación
```bash
npm install
npm run start
```