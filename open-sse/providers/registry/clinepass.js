export default {
  id: "clinepass",
  priority: 81,
  alias: "cp",
  aliases: [
    "cp",
    "clinepass"
  ],
  uiAlias: "cp",
  display: {
    name: "Cline Pass",
    icon: "smart_toy",
    color: "#5B9BD5",
    textIcon: "CP",
    website: "https://cline.bot",
    notice: {
      signupUrl: "https://app.cline.bot",
      apiKeyUrl: "https://app.cline.bot",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://api.cline.bot/api/v1/chat/completions",
    validateUrl: "https://api.cline.bot/api/v1/chat/completions", // Chat completion is used for validation instead of 404 models endpoint
    headers: {
      "HTTP-Referer": "https://cline.bot",
      "X-Title": "Cline",
    },
    auth: {
      combined: true,
      header: "Authorization",
      scheme: "bearer",
    },
  },
  models: [
    { id: "cline-pass/glm-5.2", name: "GLM-5.2" },
    { id: "cline-pass/kimi-k2.7-code", name: "Kimi K2.7 Code" },
    { id: "cline-pass/kimi-k2.6", name: "Kimi K2.6" },
    { id: "cline-pass/deepseek-v4-pro", name: "DeepSeek V4 Pro" },
    { id: "cline-pass/deepseek-v4-flash", name: "DeepSeek V4 Flash" },
    { id: "cline-pass/mimo-v2.5", name: "MiMo-V2.5" },
    { id: "cline-pass/mimo-v2.5-pro", name: "MiMo-V2.5-Pro" },
    { id: "cline-pass/minimax-m3", name: "MiniMax M3" },
    { id: "cline-pass/qwen3.7-max", name: "Qwen3.7 Max" },
    { id: "cline-pass/qwen3.7-plus", name: "Qwen3.7 Plus" },
  ],
  passthroughModels: true,
};
