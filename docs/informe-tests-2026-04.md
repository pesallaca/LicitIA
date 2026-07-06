# LicitIA — Informe de Pruebas Automatizadas

**Fecha y hora de ejecución:** 2026-04-16 (ejecución automática, tarea programada)
**Ejecutado por:** Claude Cowork (tarea programada `licitia-test-runner`)

---

## Resumen Ejecutivo

| Resultado | Cantidad |
|-----------|----------|
| ✅ Tests pasados | 0 |
| ❌ Tests fallidos | 8 |
| ⚠️ Tests omitidos | 0 |
| **Total** | **8** |

---

## Resultados Detallados

### 1. Health Check — `GET http://localhost:3001/api/health`
**Estado:** ❌ FAIL

- **Error:** No se puede conectar al servidor (connection refused / curl exit code 7)
- **Causa raíz:** El servidor backend no está corriendo en el puerto 3001.
- **Puertos activos detectados:** Solo el puerto 22 (SSH) está en escucha. No se detectó ningún proceso Node.js activo.

---

### 2. Registro de Usuario — `POST http://localhost:3001/api/auth/register`
**Estado:** ❌ FAIL (bloqueado por error anterior)

- **Error:** Servidor no disponible. Imposible ejecutar el test.

---

### 3. Login — `POST http://localhost:3001/api/auth/login`
**Estado:** ❌ FAIL (bloqueado por error anterior)

- **Error:** Servidor no disponible. Imposible ejecutar el test.

---

### 4. Endpoint de Análisis — `POST http://localhost:3001/api/analysis`
**Estado:** ❌ FAIL (bloqueado por error anterior)

- **Error:** Servidor no disponible. Imposible ejecutar el test.

---

### 5. Historial de Análisis — `GET http://localhost:3001/api/analysis`
**Estado:** ❌ FAIL (bloqueado por error anterior)

- **Error:** Servidor no disponible. Imposible ejecutar el test.

---

### 6. Generación de PDF — endpoint PDF
**Estado:** ❌ FAIL (bloqueado por error anterior)

- **Error:** Servidor no disponible. Imposible ejecutar el test.

---

### 7. Scraping PLACSP — endpoint de licitaciones
**Estado:** ❌ FAIL (bloqueado por error anterior)

- **Error:** Servidor no disponible. Imposible ejecutar el test.

---

### 8. Frontend — `GET http://localhost:3000`
**Estado:** ❌ FAIL

- **Error:** No se puede conectar al servidor frontend (connection refused).
- **Causa raíz:** El servidor frontend no está corriendo en el puerto 3000.

---

## Diagnóstico del Entorno

| Comprobación | Resultado |
|---|---|
| Puerto 3001 (backend) activo | ❌ No |
| Puerto 3000 (frontend) activo | ❌ No |
| Procesos Node.js detectados | ❌ No |
| Carpeta del proyecto `/LicitIA/` | ⚠️ Vacía (sin archivos de código) |
| Directorio de tests | ✅ Creado en esta ejecución |

**Conclusión del diagnóstico:** La aplicación LicitIA no está desplegada ni en ejecución en el entorno de sandbox Linux del agente. El directorio del proyecto montado (`LicitIA/`) está vacío, sin ficheros de código, configuración ni dependencias.

---

## Sugerencias de Corrección

### Problema principal: La aplicación no está corriendo

El fallo de todos los tests se debe a una única causa raíz: la aplicación no está iniciada. A continuación se detallan los pasos para resolverlo:

**1. Verifica que el código está desplegado en la carpeta del proyecto:**
```bash
ls ~/proyectos/LicitIA/
```
Deberías ver directorios como `backend/`, `frontend/`, `package.json`, etc.

**2. Instala las dependencias del backend:**
```bash
cd ~/proyectos/LicitIA/backend
npm install
```

**3. Configura las variables de entorno:**
Asegúrate de que existe un archivo `.env` en el directorio `backend/` con las claves necesarias (base de datos, API de IA, etc.).

**4. Inicia el servidor backend:**
```bash
cd ~/proyectos/LicitIA/backend
npm run start  # o: node server.js / npm run dev
```
El servidor debe quedar escuchando en el puerto **3001**.

**5. Inicia el frontend:**
```bash
cd ~/proyectos/LicitIA/frontend
npm install
npm run start  # o: npm run dev
```
El frontend debe quedar escuchando en el puerto **3000**.

**6. Vuelve a ejecutar esta tarea programada** para confirmar que todos los tests pasan.

---

### Si la aplicación sí está corriendo en tu máquina local (Windows)

Es posible que la aplicación esté activa en el equipo Windows del usuario, pero esta tarea programada se ejecuta en un entorno Linux aislado (sandbox) que no tiene acceso a `localhost` de Windows.

**Solución:** Para que las pruebas automatizadas funcionen, la aplicación debe estar disponible en la red local o en un servidor accesible desde este entorno, o bien las pruebas deben ejecutarse directamente en el equipo donde corre la app (p.ej., con un script PowerShell o desde la terminal de Windows).

---

## Próxima ejecución recomendada

Una vez que la aplicación esté en marcha, ejecuta de nuevo esta tarea programada. El resultado esperado sería:

- ✅ Health check OK
- ✅ Registro de usuario OK
- ✅ Login y obtención de token OK
- ✅ Análisis de licitación sin texto genérico
- ✅ Historial devuelve análisis guardados
- ✅ PDF generado correctamente
- ✅ Scraping PLACSP devuelve datos reales
- ✅ Frontend responde con HTTP 200

---

*Informe generado automáticamente por la tarea programada `licitia-test-runner` · LicitIA Test Runner*
