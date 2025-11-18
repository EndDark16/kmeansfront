# K-Means Hospitals – Frontend

Interfaz React + Vite en modo oscuro para simular vecindarios y mostrar la
ubicación óptima de hospitales calculada por el backend K-Means. Lista para
desplegar en Vercel.

## Características

- Formulario para definir `m` (tamaño de la cuadrícula), `n` vecindarios y `k` hospitales.
- Visualización SVG responsiva con grid futurista, vecindarios por color de cluster y hospitales resaltados.
- Resumen de cada hospital: número de vecindarios, coordenadas y distancia media.
- Panel de analítica con tarjetas KPI, gráficas (barras, líneas y áreas) para ver carga por hospital, distancias y distribución.
- Botón para leer el modelo preentrenado (`/kmeans/pretrained`) como referencia.
- Configuración de API via `VITE_API_URL` para diferenciar desarrollo vs producción (Render).

## Requisitos

- Node.js 20+ (el repo usa pnpm vía Corepack, pero puedes usar npm/yarn si prefieres).

## Variables de entorno

Copiar `.env.example` y ajustar:

```
VITE_API_URL=http://localhost:8000
```

En Vercel, define `VITE_API_URL` apuntando a la URL pública del backend desplegado en Render.

## Scripts disponibles

```bash
pnpm install         # Instala dependencias
pnpm dev             # Servidor de desarrollo (http://localhost:5173)
PNPM_ALLOW_BUILD_SCRIPTS=1 pnpm build  # Build de producción
pnpm preview         # Revisión local del build (requiere build previo)
```

> Nota: si Corepack bloquea scripts nativos (esbuild), ejecuta los comandos con
> `PNPM_ALLOW_BUILD_SCRIPTS=1` para permitirlos.

## Deploy en Vercel

1. Subir el repo a GitHub (ver instrucciones globales del proyecto).
2. En Vercel, crear nuevo proyecto desde el repo.
3. Configurar variable `VITE_API_URL`.
4. Comandos por defecto:
   - **Install:** `pnpm install`
   - **Build:** `pnpm build`
   - **Output:** `dist`

La aplicación quedará lista para consumir el backend hosteado en Render o cualquier otra plataforma.
