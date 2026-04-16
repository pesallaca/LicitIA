#!/bin/bash
# =============================================================================
# LicitIA - Test suite completo
# Prueba todos los endpoints de la API y muestra resumen OK/FAIL
# =============================================================================

set -uo pipefail

BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
COOKIE_JAR="/tmp/licitia-test-cookies.txt"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIEGO_FILE="$SCRIPT_DIR/pliego-test.txt"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

PASS=0
FAIL=0
RESULTS=()

# Limpiar cookie jar
rm -f "$COOKIE_JAR"

report() {
  local name="$1"
  local status="$2"
  local detail="${3:-}"
  if [ "$status" = "OK" ]; then
    RESULTS+=("${GREEN}  OK${NC}  $name${detail:+ — $detail}")
    ((PASS++))
  else
    RESULTS+=("${RED}FAIL${NC}  $name${detail:+ — $detail}")
    ((FAIL++))
  fi
}

echo -e "\n${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  LicitIA — Test Suite${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}\n"

# ─── 1. Health check ────────────────────────────────────────────────
echo -e "${YELLOW}[1/8]${NC} Health check..."
HEALTH=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health" 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH" | tail -1)
BODY=$(echo "$HEALTH" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['status']=='ok'" 2>/dev/null; then
  report "GET /api/health" "OK" "status=ok, HTTP $HTTP_CODE"
else
  report "GET /api/health" "FAIL" "HTTP $HTTP_CODE"
fi

# ─── 2. Registro ────────────────────────────────────────────────────
echo -e "${YELLOW}[2/8]${NC} Registro de usuario..."
TEST_EMAIL="test-$(date +%s)@licitia.test"
REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123456\",\"name\":\"Test User\"}" 2>/dev/null)
HTTP_CODE=$(echo "$REG" | tail -1)
BODY=$(echo "$REG" | sed '$d')

if [ "$HTTP_CODE" = "201" ] && echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['user']['email']=='$TEST_EMAIL'" 2>/dev/null; then
  report "POST /api/auth/register" "OK" "email=$TEST_EMAIL, HTTP $HTTP_CODE"
else
  report "POST /api/auth/register" "FAIL" "HTTP $HTTP_CODE — $(echo "$BODY" | head -c 100)"
fi

# ─── 3. Login ────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/8]${NC} Login..."
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123456\"}" 2>/dev/null)
HTTP_CODE=$(echo "$LOGIN" | tail -1)
BODY=$(echo "$LOGIN" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); assert 'user' in d" 2>/dev/null; then
  report "POST /api/auth/login" "OK" "HTTP $HTTP_CODE"
else
  report "POST /api/auth/login" "FAIL" "HTTP $HTTP_CODE"
fi

# ─── 4. Análisis con pliego real ─────────────────────────────────────
echo -e "${YELLOW}[4/8]${NC} Análisis con Ollama (esto tarda 2-5 min)..."
PLIEGO_CONTENT=$(python3 -c "
import json, sys
with open('$PLIEGO_FILE', 'r') as f:
    content = f.read()
print(json.dumps({'inputType': 'text', 'text': content}))
" 2>/dev/null)

ANALYSIS_RESPONSE=$(curl -s -N -X POST "$BASE_URL/api/analysis" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" \
  -d "$PLIEGO_CONTENT" 2>/dev/null)

# Extraer analysisId de la primera línea SSE
ANALYSIS_ID=$(echo "$ANALYSIS_RESPONSE" | grep -o '"analysisId":[0-9]*' | head -1 | grep -o '[0-9]*')

# Reconstruir el markdown desde las líneas SSE (excluyendo JSON metadata y [DONE])
MARKDOWN=$(echo "$ANALYSIS_RESPONSE" | grep '^data: ' | sed 's/^data: //' | grep -v '^\[DONE\]' | grep -v '^\[ERROR\]' | grep -v '^{' | tr -d '\n')

if [ -z "$MARKDOWN" ]; then
  report "POST /api/analysis (Ollama)" "FAIL" "Sin respuesta del modelo"
else
  CHAR_COUNT=${#MARKDOWN}

  # Verificar que NO es genérica
  IS_GENERIC=false
  for pattern in "\[Insertar" "como modelo de respuesta" "\[Tu nombre\]" "\[Nombre del" "Lorem ipsum"; do
    if echo "$MARKDOWN" | grep -qi "$pattern" 2>/dev/null; then
      IS_GENERIC=true
      break
    fi
  done

  # Verificar que SÍ es específica al pliego
  IS_SPECIFIC=false
  MATCHES=0
  for keyword in "Alcobendas" "450.000" "jardines" "mantenimiento" "77310000" "ISO 14001"; do
    if echo "$MARKDOWN" | grep -qi "$keyword" 2>/dev/null; then
      ((MATCHES++))
    fi
  done
  [ "$MATCHES" -ge 2 ] && IS_SPECIFIC=true

  if [ "$IS_GENERIC" = "true" ]; then
    report "POST /api/analysis (Ollama)" "FAIL" "Respuesta GENÉRICA detectada ($CHAR_COUNT chars)"
  elif [ "$IS_SPECIFIC" = "true" ]; then
    report "POST /api/analysis (Ollama)" "OK" "Respuesta específica al pliego ($CHAR_COUNT chars, $MATCHES keywords, ID=$ANALYSIS_ID)"
  else
    report "POST /api/analysis (Ollama)" "FAIL" "Respuesta no parece específica ($CHAR_COUNT chars, solo $MATCHES keywords del pliego)"
  fi
fi

# ─── 5. Historial ────────────────────────────────────────────────────
echo -e "${YELLOW}[5/8]${NC} Historial de análisis..."
HIST=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/analysis" \
  -b "$COOKIE_JAR" 2>/dev/null)
HTTP_CODE=$(echo "$HIST" | tail -1)
BODY=$(echo "$HIST" | sed '$d')

HIST_COUNT=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('total',0))" 2>/dev/null || echo "0")

if [ "$HTTP_CODE" = "200" ] && [ "$HIST_COUNT" -gt 0 ]; then
  report "GET /api/analysis (historial)" "OK" "$HIST_COUNT análisis encontrados, HTTP $HTTP_CODE"
else
  report "GET /api/analysis (historial)" "FAIL" "HTTP $HTTP_CODE, total=$HIST_COUNT"
fi

# ─── 6. Generación PDF ──────────────────────────────────────────────
echo -e "${YELLOW}[6/8]${NC} Generación de PDF..."
if [ -n "$ANALYSIS_ID" ]; then
  PDF_FILE="/tmp/licitia-test-pdf-$$.pdf"
  PDF_CODE=$(curl -s -o "$PDF_FILE" -w "%{http_code}" "$BASE_URL/api/pdf/$ANALYSIS_ID" \
    -b "$COOKIE_JAR" 2>/dev/null)
  PDF_TYPE=$(file -b "$PDF_FILE" 2>/dev/null || echo "unknown")
  PDF_SIZE=$(stat -c%s "$PDF_FILE" 2>/dev/null || echo "0")

  if [ "$PDF_CODE" = "200" ] && echo "$PDF_TYPE" | grep -qi "pdf"; then
    report "GET /api/pdf/:id" "OK" "PDF válido, ${PDF_SIZE} bytes, HTTP $PDF_CODE"
  else
    report "GET /api/pdf/:id" "FAIL" "HTTP $PDF_CODE, tipo=$PDF_TYPE"
  fi
  rm -f "$PDF_FILE"
else
  report "GET /api/pdf/:id" "FAIL" "Sin analysis_id disponible"
fi

# ─── 7. Scraping PLACSP ─────────────────────────────────────────────
echo -e "${YELLOW}[7/8]${NC} Scraping PLACSP..."
SCRAPE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/market/scrape" \
  -b "$COOKIE_JAR" 2>/dev/null)
HTTP_CODE=$(echo "$SCRAPE" | tail -1)
BODY=$(echo "$SCRAPE" | sed '$d')

SCRAPE_COUNT=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('count',0))" 2>/dev/null || echo "0")

if [ "$HTTP_CODE" = "200" ] && [ "$SCRAPE_COUNT" -gt 0 ]; then
  report "POST /api/market/scrape (PLACSP)" "OK" "$SCRAPE_COUNT licitaciones importadas, HTTP $HTTP_CODE"
else
  report "POST /api/market/scrape (PLACSP)" "FAIL" "HTTP $HTTP_CODE, count=$SCRAPE_COUNT"
fi

# ─── 8. Frontend ─────────────────────────────────────────────────────
echo -e "${YELLOW}[8/8]${NC} Frontend..."
FRONT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
FRONT_BODY=$(curl -s "$FRONTEND_URL" 2>/dev/null || echo "")

if [ "$FRONT_CODE" = "200" ] && echo "$FRONT_BODY" | grep -q "LicitIA"; then
  report "GET localhost:3000 (frontend)" "OK" "HTML con 'LicitIA', HTTP $FRONT_CODE"
else
  report "GET localhost:3000 (frontend)" "FAIL" "HTTP $FRONT_CODE"
fi

# ─── Resumen ─────────────────────────────────────────────────────────
echo -e "\n${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  RESULTADOS${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}\n"

for r in "${RESULTS[@]}"; do
  echo -e "$r"
done

TOTAL=$((PASS + FAIL))
echo -e "\n${BOLD}───────────────────────────────────────────────────${NC}"
echo -e "  ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total"
echo -e "${BOLD}───────────────────────────────────────────────────${NC}\n"

# Limpiar
rm -f "$COOKIE_JAR"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
