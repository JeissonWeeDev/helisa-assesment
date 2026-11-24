# Catálogo de cuentas — Prueba técnica full-stack

Aplicación para administrar un plan de cuentas jerárquico: consultar el árbol, crear cuentas y eliminar cuentas hoja, respetando las reglas contables del catálogo.

| Carpeta | Contenido | Puerto |
|---------|-----------|:------:|
| `api/` | NestJS + TypeScript | 3000 |
| `web/` | React + Vite + TypeScript | 5173 |

## Cómo correr el proyecto

Requisitos: Node 22 (`.nvmrc`) y npm 10+.

```bash
nvm use
npm install
npm run dev
```

Abre http://localhost:5173. El comando `npm run dev` levanta backend y frontend a la vez.

Scripts útiles:

| Script | Qué hace |
|--------|----------|
| `npm run dev` | API y frontend en modo watch |
| `npm run dev:api` | Solo la API |
| `npm run dev:web` | Solo el frontend |
| `npm run build` | Compila ambos proyectos |
| `npm test` | Pruebas de la API con Vitest |
| `npm run lint` | Lint de API y web |

Configuración opcional:

- `VITE_API_URL`: URL de la API para el frontend. Por defecto `http://localhost:3000`.
- `WEB_ORIGIN`: origen permitido por CORS. Por defecto `http://localhost:5173`.

Endpoints principales:

- `GET /accounts/tree`
- `POST /accounts`
- `DELETE /accounts/:code`

## Decisiones tomadas

### Backend con Clean Architecture

La carpeta `api/src/accounts/` está separada por capas:

- `domain/`: entidad `Account`, reglas de códigos/niveles/naturaleza, errores de negocio y la interfaz `AccountRepository`. Sin dependencias de NestJS ni frameworks.
- `application/`: casos de uso `CreateAccountUseCase`, `GetAccountTreeUseCase` y `DeleteAccountUseCase`, también independientes del framework.
- `infrastructure/`: repositorio en memoria, controlador HTTP, DTOs, filtro de excepciones y módulo de NestJS.

Las validaciones de negocio viven en el dominio. El filtro HTTP traduce los errores del dominio a respuestas claras `{ message, field? }` con estados `400`, `404` o `409`.

### Persistencia en memoria

El repositorio `InMemoryAccountRepository` prioriza tener el flujo completo funcionando dentro del tiempo de la prueba. Al implementar la interfaz `AccountRepository`, se puede reemplazar por una base de datos sin tocar dominio ni casos de uso. La contrapartida es que los datos se pierden al reiniciar la API.

### Pruebas

Para esta entrega las pruebas están en el mismo archivo que la implementación mediante in-source testing de Vitest. Cubren reglas del dominio, casos de uso y endpoints HTTP.

### Estructura del frontend

La interfaz vive en `web/src/features/accounts/`:

- `AccountsCatalogPage.tsx`: orquesta carga, creación, eliminación y estados de la pantalla.
- `api.ts`: cliente HTTP y traducción de errores de la API.
- `validation.ts`: validaciones previas al envío.
- `tree-utils.ts`: expansión total, conteo y códigos ancestro.
- `components/`: árbol recursivo y formulario de creación.
- `accounts.css`: estilos, responsive y modo oscuro.

Se usó React con estado local (`useState`/`useEffect`) y componentes propios, sin router ni librería de estado, porque el alcance es una sola pantalla. Los errores de la API se muestran junto al campo correspondiente cuando incluyen `field`.

## Qué quedó fuera

- Base de datos real, migraciones y persistencia entre reinicios.
- Autenticación, usuarios y permisos.
- Edición/renombrado de cuentas, reordenamiento y movimientos contables.
- Búsqueda, filtros y paginación del catálogo.
- Pruebas automatizadas del frontend y pruebas de accesibilidad.
- Documentación OpenAPI y validación con `class-validator`.
- Despliegue, observabilidad y endurecimiento para producción.

La prioridad fue completar el flujo de extremo a extremo: árbol conectado a la API, creación con reglas, eliminación con confirmación y manejo visible de carga y errores.

## Qué haría con más tiempo

- Me hubiera gustado tener muchos mas tiempo para desarrollar mas a profundidad el tema de la UI en el frontend, para que sea mas accesible y dinamica para los usuarios que la utilicen.

- Me hubiera gustado tambien implementar un prototipo de autenticacion para probar algunas animaciones de precarga y postcarga, llegando el flujo de entrada a estar mucho mas pulido.

- EN lo que realice junto con mi agente me hubiera gustado utilizar tailwindCSS en lugar de CSS puro, ese fue un error mio, pero para este este caso esta bien
