// Kleiner Upstash-REST-Client ohne zusätzliche Pakete.
// Erwartet ENV: KV_REST_API_URL, KV_REST_API_TOKEN

const base = process.env.KV_REST_API_URL!;
const token = process.env.KV_REST_API_TOKEN!;

if (!base || !token) {
  console.warn(
    "[kv] Achtung: KV_REST_API_URL oder KV_REST_API_TOKEN sind nicht gesetzt."
  );
}

async function callRedis<T = any>(command: (string | number | null)[]): Promise<T> {
  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // Upstash erwartet ein JSON-Array wie ["SET","key","value"]
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upstash error ${res.status}: ${text}`);
  }
  const data = await res.json().catch(() => ({}));
  return data.result as T;
}

async function get<T = any>(key: string): Promise<T | null> {
  if (!base || !token) return null;
  const result = await callRedis<string | null>(["GET", key]);
  if (result == null) return null;
  try {
    return JSON.parse(result) as T;
  } catch {
    // falls mal kein JSON drin war
    // @ts-ignore
    return result;
  }
}

async function set(key: string, value: any): Promise<"OK" | null> {
  if (!base || !token) return null;
  const payload = JSON.stringify(value);
  const result = await callRedis<"OK">(["SET", key, payload]);
  return result;
}

const kv = { get, set };
export default kv;
