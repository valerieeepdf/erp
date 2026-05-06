# User Service — ERPJir

Microservicio de gestión de usuarios, autenticación y registro. Construido con **NestJS**.

## Puerto
`3001`

## Tecnologías
- NestJS
- Fastify (adaptador)
- Prisma ORM
- bcryptjs
- JWT (@nestjs/jwt)
- class-validator
- PostgreSQL (Supabase)

## Responsabilidades
- Registro de usuarios
- Login y generación de token JWT
- Gestión de usuarios (CRUD básico)
- Validación de entradas con class-validator

## Variables de entorno
```env
PORT=3001
JWT_SECRET=erpjir_secret_key_2024
DATABASE_URL=postgresql://...
```

## Endpoints
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Registro de usuario | No |
| POST | /auth/login | Login y obtención de token | No |
| GET | /users | Listar todos los usuarios | Sí |
| GET | /users/:id | Obtener usuario por ID | Sí |
| PATCH | /users/:id | Actualizar usuario | Sí |

## Token JWT
El token incluye:
- `sub` — userId
- `username`
- `email`
- `name`
- `permissionsByGroup` — objeto con groupId → array de permisos

## Validaciones
- `name` — string, mínimo 2, máximo 50 caracteres
- `email` — formato email válido
- `username` — string, mínimo 3, máximo 30 caracteres
- `password` — string, mínimo 6, máximo 100 caracteres

## Instalación
```bash
npm install
npm run start:dev
```