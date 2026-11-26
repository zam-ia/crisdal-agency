/** Bound actual streamed bytes, even if Content-Length is missing or false. */
export class JsonBodyError extends Error {
  constructor(public readonly status: 400 | 413 | 415) {
    super(status === 413 ? "Solicitud demasiado grande." : status === 415 ? "Formato inválido." : "JSON inválido.");
  }
}
export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("Invalid body limit");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new JsonBodyError(415);
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new JsonBodyError(413);
  if (!request.body) throw new JsonBodyError(400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0, text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new JsonBodyError(413);
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof JsonBodyError) throw error;
    throw new JsonBodyError(400);
  } finally { reader.releaseLock(); }
}
