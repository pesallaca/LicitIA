# LicitIA — Inteligencia de licitaciones públicas para PYMEs

SaaS que ayuda a las PYMEs españolas en el proceso de contratación pública:

- 🔎 **Radar de licitaciones**: ingesta automática del feed oficial de PLACSP cada 6 horas.
- 🎯 **"Para ti"**: matching automático entre el perfil de tu empresa (CPV, palabras clave, presupuesto) y las licitaciones publicadas.
- 🤖 **Análisis IA de pliegos**: pega o sube un pliego (PCAP/PPT) y obtén un informe estratégico de 7 bloques (idoneidad para PYME, criterios de adjudicación, riesgos, recomendación final) basado solo en los datos del documento.
- 📄 **Informes**: descarga en PDF y enlaces compartibles con caducidad (30 días).
- 👤 **Self-service**: registro abierto, planes con cuota mensual (Free: 5 análisis/mes · Pro: 100).

## Stack

- **Backend**: Node 20 + Express + TypeScript · SQLite (better-sqlite3, WAL) · JWT en cookie httpOnly · Zod · migraciones versionadas (PRAGMA user_version).
- **IA**: proveedor conmutable — Ollama (local) u OpenAI — vía `LLM_PROVIDER`.
- **Frontend**: React 19 + Vite + Tailwind 4.
- **Datos**: feed ATOM CODICE de la Plataforma de Contratación del Sector Público.

## Desarrollo

```bash
cp .env.example .env      # revisa JWT_SECRET y el proveedor LLM
npm install               # raíz (orquestación)
npm --prefix server install
npm --prefix client install
npm run dev               # server :3001 + client :3000
```

## Tests

```bash
cd server && npm test         # unit tests (vitest): matching, cuotas, migraciones
cd server && npm run typecheck
```

`tests/test.sh` contiene además un smoke test manual end-to-end (requiere la app levantada).

## Operación

| Variable | Efecto |
|---|---|
| `MAINTENANCE_MODE=true` | Desactiva el análisis IA (503) sin tocar código |
| `ALLOW_REGISTRATION=false` | Cierra el registro self-service |
| `MAX_TENDER_CHARS` | Tamaño máx. del pliego enviado al modelo (def. 48000) |
| `SHARE_EXPIRY_DAYS` | Caducidad de los enlaces compartidos (def. 30) |

El scraping manual (`POST /api/market/scrape`) es solo para administradores; el sistema se actualiza solo cada 6 h.
