<h1 align="center">The Archaeologist</h1>
<p align="center"><strong>Steam Tracker + Browser Extension</strong></p>
<p align="center">
	Sincroniza tu biblioteca de Steam, guarda snapshots historicos de tiempo jugado
	y visualiza estadisticas desde una app web moderna.
</p>

<p align="center">
	<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
	<img src="https://img.shields.io/badge/React-19-0ea5e9?style=for-the-badge&logo=react&logoColor=white" alt="React" />
	<img src="https://img.shields.io/badge/TypeScript-5-2563eb?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
	<img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-16a34a?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
	<img src="https://img.shields.io/badge/Chrome%20Extension-MV3-f97316?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension" />
</p>

## Tabla de contenido

- [Que hace este proyecto](#que-hace-este-proyecto)
- [Arquitectura](#arquitectura)
- [Stack tecnico](#stack-tecnico)
- [Requisitos](#requisitos)
- [Instalacion local](#instalacion-local)
- [Variables de entorno](#variables-de-entorno)
- [Configurar la extension](#configurar-la-extension)
- [Uso rapido](#uso-rapido)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del repo](#estructura-del-repo)
- [Problemas comunes](#problemas-comunes)

## Que hace este proyecto

La plataforma tiene dos partes:

1. App web en Next.js para autenticacion, perfil y dashboard.
2. Extension de navegador para escanear la pagina de juegos de Steam y sincronizar resultados.

Con cada sincronizacion se guardan snapshots de tiempo jugado, para poder analizar evolucion historica.

## Arquitectura

1. Usuario inicia sesion con Supabase Auth.
2. Usuario vincula su Steam ID en el perfil.
3. El dashboard puede sincronizar via API oficial de Steam (`/api/steam/sync`).
4. La extension tambien puede escanear desde `steamcommunity.com/.../games` y enviar datos al background.
5. Los datos se guardan en Supabase en tablas de catalogo de juegos y snapshots.

## Stack tecnico

- Frontend: Next.js 16, React 19, TypeScript.
- Backend: Route Handlers de Next.js (App Router).
- Auth y DB: Supabase.
- Extension: Chrome Extension Manifest V3.

## Requisitos

- Node.js 20+
- npm 10+
- Proyecto en Supabase
- Steam Web API Key
- Google Chrome o navegador compatible con extensiones MV3

## Instalacion local

```bash
npm install
npm run dev
```

App local en: http://localhost:3000

## Variables de entorno

Crea un archivo `.env.local` en la raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
STEAM_API_KEY=TU_STEAM_API_KEY
```

Notas:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` se usan en cliente, servidor y middleware.
- `STEAM_API_KEY` se usa en el servidor para consultar juegos de Steam por API oficial.

## Configurar la extension

1. Abre `chrome://extensions`.
2. Activa Developer mode.
3. Pulsa Load unpacked.
4. Selecciona la carpeta `browser-extension`.

La extension usa URL y key de Supabase en el popup. Revisa y ajusta estos valores si cambian en tu proyecto:

- `SUPABASE_URL`
- `SUPABASE_KEY`

## Uso rapido

1. Inicia la app web y crea cuenta.
2. En perfil, guarda tu Steam ID de 64 bits.
3. En dashboard, usa Sincronizar Steam para importar por API.
4. Para escaneo por extension:
	 - navega a `https://steamcommunity.com/id/TU_ID/games`
	 - abre la extension
	 - inicia sesion y pulsa Escanear

## Scripts disponibles

| Script | Descripcion |
| --- | --- |
| `npm run dev` | Inicia entorno de desarrollo |
| `npm run build` | Compila para produccion |
| `npm run start` | Ejecuta build de produccion |
| `npm run lint` | Ejecuta ESLint |

## Estructura del repo

```text
.
|-- browser-extension/
|   |-- background.js
|   |-- content_script.js
|   |-- injected.js
|   |-- manifest.json
|   `-- popup/
|-- public/
`-- src/
		|-- app/
		|-- components/
		`-- lib/
```

## Problemas comunes

### La extension se queda cargando

- Verifica que `SUPABASE_URL` y `SUPABASE_KEY` sean validos.
- Revisa que exista conexion a internet.
- Recarga la extension en `chrome://extensions`.

### Error al escanear

- Abre una URL valida de juegos: `steamcommunity.com/id/TU_ID/games` o `steamcommunity.com/profiles/TU_STEAMID64/games`.
- Recarga la pestana de Steam despues de instalar o actualizar la extension.

### Dashboard sin datos

- Asegurate de tener Steam ID guardado en el perfil.
- Verifica que el perfil/juegos de Steam sean visibles para poder obtener datos.

---

Proyecto construido para seguimiento historico de actividad en Steam con enfoque practico: sincronizar rapido, guardar snapshots y visualizar progreso.
