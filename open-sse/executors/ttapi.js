import { DefaultExecutor } from "./default.js";

/**
 * TtapiExecutor — talks to https://api.ttapi.io/v1/chat/completions
 *
 * Auth: TT-API-KEY header (not standard Bearer).
 * Auth is handled automatically via the registry auth descriptor:
 *   { combined: true, header: "TT-API-KEY", scheme: "raw" }
 *
 * SSE quirks vs standard OpenAI SSE:
 *   - Each chunk is preceded by "retry:NNNN\n" lines → strip them
 *   - Each chunk has an "id:null\n" or "id:[DONE]\n" line → strip them
 *   - Terminator is "id:[DONE]\ndata:[DONE]\n" without space after colon
 *     → normalize to standard "data: [DONE]\n\n"
 *   - data: chunks may also lack space: "data:{...}" → normalize to "data: {...}"
 *
 * All normalization happens in a TransformStream that wraps the upstream body
 * so the standard 9router SSE handlers receive clean OpenAI-compatible SSE.
 */
export class TtapiExecutor extends DefaultExecutor {
  constructor() {
    super("ttapi");
  }

  transformRequest(model, body) {
    const transformed = super.transformRequest(model, body);
    if (/gpt-5|o[134]-/i.test(model) && transformed.max_tokens !== undefined) {
      transformed.max_completion_tokens = transformed.max_tokens;
      delete transformed.max_tokens;
    }
    return transformed;
  }

  async execute(opts) {
    const result = await super.execute(opts);
    if (!result?.response?.ok || !result.response.body) return result;

    const ct = result.response.headers.get("content-type") || "";
    if (ct.includes("text/event-stream")) {
      result.response = this._normalizeSse(result.response);
    }
    return result;
  }

  _normalizeSse(originalResponse) {
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();
    let buffer = "";

    const transform = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();

          // Skip TTAPI-specific SSE framing lines
          if (!trimmed || trimmed.startsWith("retry:") || trimmed.startsWith("id:")) continue;

          // Drop [DONE] — 9router's passthrough stream handler appends it in flush.
          // Emitting it here causes a double data: [DONE] in the client response.
          if (trimmed === "data:[DONE]" || trimmed === "data: [DONE]") continue;

          // Normalize data chunks missing the space: "data:{...}" → "data: {...}"
          if (trimmed.startsWith("data:") && !trimmed.startsWith("data: ")) {
            controller.enqueue(encoder.encode("data: " + trimmed.slice(5) + "\n\n"));
            continue;
          }

          // Pass through everything else (well-formed data: lines, empty lines)
          controller.enqueue(encoder.encode(line + "\n"));
        }
      },

      flush(controller) {
        const remaining = decoder.decode();
        if (remaining) buffer += remaining;

        const trimmed = buffer.trim();
        if (!trimmed) return;

        // Drop [DONE] and TTAPI framing lines
        if (trimmed === "data:[DONE]" || trimmed === "data: [DONE]") return;
        if (trimmed.startsWith("retry:") || trimmed.startsWith("id:")) return;

        // Normalize missing space
        if (trimmed.startsWith("data:") && !trimmed.startsWith("data: ")) {
          controller.enqueue(encoder.encode("data: " + trimmed.slice(5) + "\n\n"));
        } else {
          controller.enqueue(encoder.encode(buffer + "\n"));
        }
      },
    });

    const headers = new Headers(originalResponse.headers);
    headers.delete("content-length");
    headers.delete("Content-Length");

    return new Response(originalResponse.body.pipeThrough(transform), {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers,
    });
  }
}

export default TtapiExecutor;
