/**
 * Главный скрипт ядра The Endless Assistant
 */
import { registerSettings, initLastFeatureState } from "./settings.js";
import { role, canOpenGM, open, registerShell } from "./router.js";
import { registerFeature, listFeatures, listAllFeatures, setFeatureEnabled, setFeatureVisibleToPlayers, initializeClientFeatures } from "./registry.js";
import { registerControls } from "./controls.js";

Hooks.once("init", () => {
  // Регистрируем настройки модуля
  registerSettings();

  // Регистрируем кнопку в панели управления сценой в init
  registerControls();

  // Формируем объект API по контракту
  const api = {
    role,
    canOpenGM,
    open,
    registerShell,
    registerFeature,
    features: {
      list: listFeatures,
      listAll: listAllFeatures,
      setEnabled: setFeatureEnabled,
      setVisibleToPlayers: setFeatureVisibleToPlayers
    }
  };

  Object.freeze(api.features);
  Object.freeze(api);

  // Присваиваем API в структуру модуля Foundry
  const mod = game.modules.get("endless-assistant");
  if (mod) {
    mod.api = api;
  }

  // Оповещаем другие модули об инициализации ядра
  Hooks.callAll("endlessAssistant.init", api);
});

Hooks.once("ready", () => {
  // Инициализируем снимок lastFeatureState для корректного сравнения в onChange
  initLastFeatureState();
  // Инициализируем состояние функций на клиенте
  initializeClientFeatures();
});
