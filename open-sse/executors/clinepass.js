import { DefaultExecutor } from "./default.js";
import { PROVIDERS } from "../config/providers.js";

export class ClinepassExecutor extends DefaultExecutor {
  constructor() {
    super("clinepass");
  }

  async execute(opts) {
    const result = await super.execute(opts);
    if (!result?.response?.ok) return result;

    const contentType = result.response.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream") && result.response.body) {
      result.response = this.wrapSseResponse(result.response);
    } else {
      result.response = await this.wrapJsonResponse(result.response);
    }

    return result;
  }

  async wrapJsonResponse(originalResponse) {
    try {
      const data = await originalResponse.json();
      const headers = new Headers(originalResponse.headers);
      headers.delete("content-length");
      headers.delete("Content-Length");

      if (data && data.success && data.data) {
        return new Response(JSON.stringify(data.data), {
          status: originalResponse.status,
          statusText: originalResponse.statusText,
          headers,
        });
      }
      return new Response(JSON.stringify(data), {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers,
      });
    } catch (e) {
      return originalResponse;
    }
  }

  wrapSseResponse(originalResponse) {
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();
    let buffer = "";

    const headers = new Headers(originalResponse.headers);
    headers.delete("content-length");
    headers.delete("Content-Length");

    const transform = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } else {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed && parsed.success && parsed.data) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed.data)}\n\n`));
                } else if (parsed && parsed.data) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed.data)}\n\n`));
                } else {
                  controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
                }
              } catch (e) {
                // If it's invalid JSON, just pass it through
                controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
              }
            }
          } else {
            controller.enqueue(encoder.encode(line + "\n"));
          }
        }
      },
      flush(controller) {
        const remaining = decoder.decode();
        if (remaining) {
          buffer += remaining;
        }
        const trimmed = buffer.trim();
        if (trimmed) {
          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } else {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed && parsed.success && parsed.data) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed.data)}\n\n`));
                } else if (parsed && parsed.data) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed.data)}\n\n`));
                } else {
                  controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
                }
              } catch (e) {
                controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
              }
            }
          } else {
            controller.enqueue(encoder.encode(trimmed + "\n"));
          }
        }
      }
    });

    const newBody = originalResponse.body.pipeThrough(transform);
    return new Response(newBody, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers,
    });
  }
}

export default ClinepassExecutor;
