/**
 * Регистрация настроек модуля The Endless Assistant
 */
let lastFeatureState = null;

export function registerSettings() {
  // Сначала регистрируем обе настройки
  game.settings.register("endless-assistant", "allowAssistantGM", {
    name: "ENDLESS.Settings.AllowAssistantGM.Name",
    hint: "ENDLESS.Settings.AllowAssistantGM.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("endless-assistant", "featureState", {
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: (value) => {
      if (!lastFeatureState) {
        lastFeatureState = foundry.utils.deepClone(game.settings.get("endless-assistant", "featureState") || {});
      }
      let changedId = null;
      const oldVal = lastFeatureState || {};
      const newVal = value || {};
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
      for (const k of allKeys) {
        if (JSON.stringify(oldVal[k]) !== JSON.stringify(newVal[k])) {
          changedId = k;
          break;
        }
      }
      lastFeatureState = foundry.utils.deepClone(newVal);
      Hooks.callAll("endlessAssistant.featureChanged", { id: changedId, state: newVal });
    }
  });
}

/**
 * Инициализация снимка lastFeatureState в хуке ready через deepClone
 */
export function initLastFeatureState() {
  lastFeatureState = foundry.utils.deepClone(game.settings.get("endless-assistant", "featureState") || {});
}
