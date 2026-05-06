# Frontend — ERPJir

Aplicación web de gestión de tickets empresarial. Construida con **Angular 21** y **PrimeNG**.

## Puerto
`4200`

## Tecnologías
- Angular 21
- PrimeNG 21
- Angular CDK (drag and drop)
- ngx-cookie-service
- TypeScript

## Estructura de componentes
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   └── services/
│       ├── auth.service.ts
│       ├── groups.service.ts
│       ├── permission.service.ts
│       ├── tickets.service.ts
│       └── users.service.ts
├── pages/
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── tickets/
│   ├── profile/
│   ├── admin-group/
│   └── admin-user/
└── shared/
└── directives/
└── has-permission.directive.ts

## Vistas
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| /login | LoginComponent | Inicio de sesión |
| /register | RegisterComponent | Registro de usuario |
| /dashboard | DashboardComponent | Estadísticas y grupos |
| /tickets | TicketsComponent | Kanban y Lista de tickets |
| /profile | ProfileComponent | Perfil del usuario |
| /admin/groups | AdminGroupComponent | Gestión de grupos |
| /admin/users | AdminUserComponent | Gestión de usuarios |

## Permisos y directiva
La directiva `appHasPermission` elimina elementos del DOM si el usuario no tiene el permiso:

```html
<button *appHasPermission="'tickets:add'">Agregar Ticket</button>
```

## Autenticación
- Token JWT guardado en **cookie**
- Permisos por grupo guardados en **localStorage**
- Interceptor agrega `Authorization: Bearer <token>` a cada request

## Variables de entorno
API_URL=http://localhost:3000

## Instalación
```bash
npm install
ng serve
```

## Usuarios de prueba
| Usuario | Contraseña | Permisos |
|---------|-----------|---------|
| testuser | Test123! | tickets:add, tickets:move, groups:manage, users:manage |
| admin | Admin123! | tickets:add, groups:manage |