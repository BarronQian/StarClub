/**
 * Safely reads a fetch Response as JSON. Some failures (e.g. a body-size
 * limit enforced by a proxy/platform in front of the route handler) return
 * a plain-text or HTML error body instead of JSON — for example a
 * "Request Entity Too Large" response. Blindly calling `res.json()` on
 * such a response throws an opaque "Unexpected token ... is not valid
 * JSON" error instead of surfacing the real server message, so callers
 * should use this helper instead of `res.json()` directly.
 */
export async function readJsonResponse(
  res: Response,
): Promise<{ ok: boolean; data: Record<string, unknown>; message: string }> {
  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data, message: typeof data.error === 'string' ? data.error : '' }
  }

  const text = await res.text().catch(() => '')
  const fallback = text.trim().slice(0, 200) || `请求失败（状态码 ${res.status}）`
  return { ok: false, data: {}, message: fallback }
}
