# Tickets Service — ERPJir

Microservicio de gestión de tickets. Construido con **Fastify**.

## Puerto
`3003`

## Tecnologías
- Fastify
- Prisma ORM
- @prisma/adapter-pg
- PostgreSQL (Supabase)

## Responsabilidades
- Creación, edición y eliminación de tickets
- Consulta de tickets por grupo
- Cambio de estado de tickets
- Validación de permisos por header

## Variables de entorno
```env
PORT=3003
DATABASE_URL=postgresql://...
```

## Endpoints
| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | /tickets | Listar tickets por grupo | Sí |
| GET | /tickets/:id | Obtener ticket por ID | Sí |
| POST | /tickets | Crear ticket | tickets:add |
| PATCH | /tickets/:id/status | Cambiar estado | tickets:move |
| PATCH | /tickets/:id | Editar ticket | Sí |
| DELETE | /tickets/:id | Eliminar ticket | Sí |
| GET | /health | Health check | No |

## Estados de tickets
- `TODO` — Por Hacer
- `IN_PROGRESS` — En Progreso
- `DONE` — Completado

## Prioridades
- `HIGH` — Alta
- `MEDIUM` — Media
- `LOW` — Baja

## Validaciones (JSON Schema)
- `title` — string, mínimo 1, máximo 200 caracteres
- `description` — string opcional, máximo 1000 caracteres
- `priority` — enum: HIGH, MEDIUM, LOW
- `status` — enum: TODO, IN_PROGRESS, DONE
- `groupId` — UUID válido
- `assignedTo` — UUID válido (opcional)

## Instalación
```bash
npm install
npm run start
```