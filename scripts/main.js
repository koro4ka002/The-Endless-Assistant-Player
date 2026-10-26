Hooks.once("endlessAssistant.init", api => api.registerShell({ role: "player", load: async () => (await import("./player-shell.js")).PlayerShell }));
