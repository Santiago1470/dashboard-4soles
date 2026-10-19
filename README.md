# 4Soles · Dashboard Clínico de consumo de nicotina (prototipo)

Prototipo de dashboard dirigido a **neumólogos y psicólogos** para revisar el patrón de
consumo de un paciente (puffs detectados por giroscopio/acelerómetro de un reloj
inteligente y registrados por la app móvil).

**Estado actual**: solo datos locales en CSV. Sin base de datos, sin servicios externos.

## Arquitectura (prototipo)

```
dashboard-4soles/
├── backend/                  # Python 3 · FastAPI + Pandas
│   ├── app/
│   │   ├── main.py           # API REST (endpoints /api/*)
│   │   └── data_loader.py    # Lectura/normalización de CSV
│   ├── data/                 # ← copia aquí tus CSV (no se suben al repo)
│   ├── requirements.txt
│   └── .venv/                # entorno virtual Python
└── frontend/                 # React 19 + TypeScript + Vite
    └── src/
        ├── api/              # cliente HTTP + tipos
        ├── components/       # KpiCard, gráficos (Recharts), tabla
        ├── App.tsx           # layout del dashboard
        └── theme.ts          # tema MUI
```

- El backend lee **todos los `.csv`** de `backend/data/` en cada arranque (o al llamar
  `POST /api/reload`) y los normaliza a un esquema único.
- El frontend (Vite) hace **proxy de `/api` → `http://127.0.0.1:8000`**, por lo que no
  hay problemas de CORS en desarrollo.

## Formatos de CSV aceptados

El loader (`backend/app/data_loader.py`) detecta automáticamente las columnas
(distinto capitalizado, espacios, alias en español). Se aceptan dos familias:

1. **Formato reloj (automático)** — una fila = un puff:

   ```csv
   user_id,timestamp,date,daily_limit,puff_number,within_limit
   908a698c-...,2025-12-03 06:00:10.307+00,2025-12-03,121,1,True
   ```

2. **Formato manual (app antigua)** — una fila = N puffs de un día:

   ```csv
   user_id,date,puffs
   908a698c-...,2025-12-03,12
   ```

Columnas alias aceptadas: `id_usuario`, `fecha_hora`, `fecha`, `limite_diario`,
`cantidad`, `count`, `caladas`, `dentro_del_limite`, etc.

Si `within_limit` no viene en el CSV, se **recalcula**: los primeros `daily_limit`
puffs del día se consideran dentro del límite.

## Cómo ejecutarlo

### 1. Backend (terminal 1)

```powershell
cd backend
.venv\Scripts\Activate.ps1          # o crea el venv: python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

Verificar: abrir <http://127.0.0.1:8000/api/health> (o `/docs` para la UI Swagger).

### 2. Frontend (terminal 2)

```powershell
cd frontend
npm install
npm run dev
```

Abrir <http://localhost:5173> (usa `localhost`, no `127.0.0.1`: Vite escucha en IPv6).

### 3. Añadir tus datos

Copia tus archivos CSV a `backend/data/` y llama `POST /api/reload` (o reinicia el
backend). Aparecerán automáticamente en el selector de pacientes.

## Endpoints de la API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado, archivos cargados, nº de filas/usuarios |
| POST | `/api/reload` | Vuelve a leer los CSV de `backend/data/` |
| GET | `/api/users` | Lista de pacientes con rango de fechas |
| GET | `/api/users/{id}/summary` | KPIs: total, promedio, % días dentro del límite, tendencia 7 días |
| GET | `/api/users/{id}/daily` | Serie diaria: puffs, límite, dentro/fuera |
| GET | `/api/users/{id}/hourly` | Distribución horaria del consumo |
| GET | `/api/users/{id}/puffs?day=YYYY-MM-DD` | Detalle de puffs de un día (timeline) |

## Qué muestra el dashboard

- **Selector de paciente** (si hay varios CSV/usuarios).
- **KPIs**: total de puffs, promedio diario, % de días dentro del límite, tendencia
  de los últimos 7 días vs. los 7 previos.
- **Gráfico diario**: barras de puffs por día con la línea del límite terapéutico.
- **Patrón horario**: en qué franjas del día concentra el consumo.
- **Adherencia**: % diario de puffs dentro del límite.
- **Timeline intra-día**: tabla con cada puff, su hora, número, límite y estado.

## Evolución prevista (no implementada aún)

1. **Base de datos**: sustituir la carga CSV por PostgreSQL (el loader ya normaliza
   los datos, lo que facilita el paso a tablas).
2. **Ingesta en vivo**: endpoint para que la app móvil/reloj envíe registros.
3. **Auth y multi-clínica**: roles (médico, psicólogo) y asignación de pacientes.
4. **Despliegue**: Azure (App Service + Azure Database for PostgreSQL).

