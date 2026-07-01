export default {
  id: "agentrouter",
  priority: 35,
  alias: "agentrouter",
  aliases: ["agentrouter"],
  display: {
    name: "AgentRouter",
    icon: "smart_toy",
    color: "#D97757",
    textIcon: "AR",
    website: "https://agentrouter.org",
    notice: {
      apiKeyUrl: "https://agentrouter.org",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://agentrouter.org/v1/messages",
    format: "claude",
    timeoutMs: 120_000,
    auth: {
      apiKey: {
        header: "x-api-key",
        scheme: "raw",
      },
      anthropicVersion: true,
      hooks: [
        "agentrouterOverlay",
      ],
    },
  },
  models: [
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
    { id: "claude-opus-4-8", name: "Claude Opus 4.8" },
  ],
  passthroughModels: true,
  serviceKinds: ["llm"],
};
