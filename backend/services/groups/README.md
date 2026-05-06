# Groups Service — ERPJir

Microservicio de gestión de grupos/workspaces y permisos por usuario. Construido con **NestJS**.

## Puerto
`3002`

## Tecnologías
- NestJS
- Fastify (adaptador)
- Prisma ORM
- class-validator
- PostgreSQL (Supabase)

## Responsabilidades
- Creación, edición y eliminación de grupos
- Asignación de usuarios a grupos
- Configuración de permisos por usuario por grupo
- Consulta de grupos por usuario

## Variables de entorno
```env
PORT=3002
DATABASE_URL=postgresql://...
```

## Endpoints
| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | /groups | Listar todos los grupos | Sí |
| POST | /groups | Crear grupo | groups:manage |
| PATCH | /groups/:id | Editar grupo | groups:manage |
| DELETE | /groups/:id | Eliminar grupo | groups:manage |
| GET | /groups/user/:userId | Grupos de un usuario | Sí |
| POST | /groups/assign | Asignar usuario a grupo | groups:manage |
| POST | /groups/setup | Setup inicial | No |
| GET | /groups/:groupId/permissions/:userId | Permisos de usuario en grupo | Sí |

## Permisos disponibles
- `tickets:add` — Crear tickets
- `tickets:move` — Mover tickets entre estados
- `groups:manage` — Administrar grupos
- `users:manage` — Administrar usuarios

## Validaciones
- `name` — string, mínimo 2, máximo 50 caracteres
- `description` — string opcional, máximo 200 caracteres
- `userId` — UUID válido
- `groupId` — UUID válido
- `permissions` — array de strings

## Instalación
```bash
npm install
npm run start:dev
```