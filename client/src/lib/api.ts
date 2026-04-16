const BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export function apiGet<T>(path: string): Promise<T> {
  return request(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request(path, { method: 'DELETE' });
}

export async function apiStream(
  path: string,
  body: unknown,
  onChunk: (fullText: string) => void,
): Promise<{ text: string; analysisId?: number }> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Error ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No se pudo leer la respuesta');

  const decoder = new TextDecoder();
  let full = '';
  let analysisId: number | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        if (data.startsWith('[ERROR]')) throw new Error(data.slice(8));
        // Check if it's the initial JSON with analysisId
        if (data.startsWith('{')) {
          try {
            const json = JSON.parse(data);
            if (json.type === 'id') {
              analysisId = json.analysisId;
              continue;
            }
          } catch { /* not JSON, treat as text */ }
        }
        full += data;
        onChunk(full);
      }
    }
  }

  return { text: full, analysisId };
}
