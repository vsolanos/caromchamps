# CaromChamps - Configuracion Supabase

## 1. Variables de entorno

En Cloudflare Pages > Settings > Environment variables, agregar:

```text
VITE_SUPABASE_URL=https://vmcbaexkbenbesygxccu.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key de Supabase>
```

## 2. Auth URLs

En Supabase > Authentication > URL Configuration:

```text
Site URL: https://caromchamps.com
Redirect URLs:
https://caromchamps.com/*
http://localhost:5173/*
```

## 3. SQL

Ejecutar los archivos en Supabase > SQL Editor, en este orden:

```text
docs/supabase_schema_v5.sql
docs/supabase_migration_v7_3.sql
docs/supabase_migration_v7_4.sql
```

Los scripts son idempotentes y tambien migran proyectos instalados con versiones anteriores. La migracion v7_3 protege la asignacion de roles en el servidor; la v7_4 saca la PII (cedula, correo, telefono) del payload publico de inscripciones y crea la RPC `match_public_registration_player`.

## 4. Usuario Super usuario

Crear o registrar el usuario con el correo:

```text
vsolanos@gmail.com
```

El script asigna automaticamente el rol `SUPER_USER` a ese correo cuando el usuario exista en Supabase Auth. Los demas usuarios nuevos quedan como `USER`; el rol `VIEWER` puede asignarse desde la administracion de usuarios.

Si el proyecto ya fue instalado con una version anterior, vuelva a ejecutar `docs/supabase_schema_v5.sql`. El script migra `ADMIN` a `SUPER_USER` y `ORGANIZER` a `USER`.

No guardar contrasenas en GitHub ni en archivos del proyecto.

## 5. Proveedores sociales

Activar en Supabase Auth:

- Email
- Google
- Facebook

Instagram queda para una fase posterior.

## 6. Storage

El script crea el bucket publico:

```text
user-avatars
```

con limite de 5 MB y tipos permitidos JPG, PNG y WEBP.
