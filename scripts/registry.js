/**
 * Реестр функций ассистента
 */
import { canOpenGM } from "./router.js";

const registry = new Map();
const clientEnabledStates = new Map();

/**
 * Регистрация функции
 * @param {Object} feature 
 */
export function registerFeature(feature) {
  if (!feature || typeof feature.id !== "string") {
    console.error("Endless Assistant | Feature must have a string id");
    return;
  }
  if (!["gm", "player", "both"].includes(feature.audience)) {
    console.error(`Endless Assistant | Invalid audience "${feature.audience}" for feature "${feature.id}". Must be "gm", "player", or "both".`);
    return;
  }
  if (typeof feature.titleKey !== "string") {
    console.error(`Endless Assistant | Feature "${feature.id}" must have a string titleKey`);
    return;
  }

  if (registry.has(feature.id)) {
    console.warn(`Endless Assistant | Feature with id "${feature.id}" is already registered. Overwriting.`);
  }
  
  // Значения по умолчанию
  const defaultVisible = feature.audience === "player" || feature.audience === "both";
  const processed = {
    order: 0,
    defaultEnabled: false,
    visibleToPlayers: defaultVisible,
    ...feature
  };
  
  registry.set(feature.id, processed);
}

/**
 * Получение текущего состояния функции из настроек или дефолтов
 */
function getFeatureState(id, feature) {
  const stateMap = game.settings.get("endless-assistant", "featureState") || {};
  const current = stateMap[id];
  if (current) {
    return {
      enabled: current.enabled ?? feature.defaultEnabled,
      visibleToPlayers: current.visibleToPlayers ?? feature.visibleToPlayers
    };
  }
  return {
    enabled: feature.defaultEnabled,
    visibleToPlayers: feature.visibleToPlayers
  };
}

/**
 * Инициализация состояния функций на клиенте (вызывается при ready)
 */
export function initializeClientFeatures() {
  for (const [id, feature] of registry.entries()) {
    const state = getFeatureState(id, feature);
    clientEnabledStates.set(id, state.enabled);
    if (state.enabled && typeof feature.onEnable === "function") {
      try {
        feature.onEnable();
      } catch (err) {
        console.error(`Endless Assistant | Error in onEnable for feature ${id} on ready:`, err);
      }
    }
  }

  // Слушаем изменения featureState для вызова onEnable/onDisable на каждом клиенте
  Hooks.on("endlessAssistant.featureChanged", () => {
    checkAndTriggerFeatureTransitions();
  });
}

/**
 * Проверка переходов enabled и вызов onEnable/onDisable
 */
function checkAndTriggerFeatureTransitions() {
  for (const [id, feature] of registry.entries()) {
    const state = getFeatureState(id, feature);
    const wasEnabled = clientEnabledStates.get(id) ?? false;
    
    if (state.enabled !== wasEnabled) {
      clientEnabledStates.set(id, state.enabled);
      try {
        if (state.enabled && typeof feature.onEnable === "function") {
          feature.onEnable();
        } else if (!state.enabled && typeof feature.onDisable === "function") {
          feature.onDisable();
        }
      } catch (err) {
        console.error(`Endless Assistant | Error in onEnable/onDisable transition for feature ${id}:`, err);
      }
    }
  }
}

/**
 * Список включенных функций, видимых для роли
 * @param {string} role "gm" | "player"
 */
export function listFeatures(role) {
  if (role === "gm" && !canOpenGM()) {
    return [];
  }
  const result = [];
  for (const [id, feature] of registry.entries()) {
    const state = getFeatureState(id, feature);
    if (!state.enabled) continue;

    if (role === "player") {
      if (state.visibleToPlayers && (feature.audience === "player" || feature.audience === "both")) {
        result.push({ ...feature, ...state });
      }
    } else {
      // Для роли gm возвращает ТОЛЬКО audience "gm" и "both"
      if (feature.audience === "gm" || feature.audience === "both") {
        result.push({ ...feature, ...state });
      }
    }
  }
  return result.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Все функции с состоянием (только ГМ)
 */
export function listAllFeatures() {
  if (!canOpenGM()) {
    throw new Error(game.i18n.localize("ENDLESS.errors.gmOnly"));
  }
  
  const result = [];
  for (const [id, feature] of registry.entries()) {
    const state = getFeatureState(id, feature);
    result.push({ ...feature, ...state });
  }
  return result.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Установка состояния активности функции (только ГМ)
 * @param {string} id 
 * @param {boolean} enabled 
 */
export async function setFeatureEnabled(id, enabled) {
  if (!canOpenGM()) {
    throw new Error(game.i18n.localize("ENDLESS.errors.gmOnly"));
  }
  
  const feature = registry.get(id);
  if (!feature) {
    throw new Error(`Feature with id "${id}" not found.`);
  }

  // Не мутируем объект из game.settings.get: клонируем через foundry.utils.deepClone
  const rawState = game.settings.get("endless-assistant", "featureState") || {};
  const stateMap = foundry.utils.deepClone(rawState);
  const currentState = getFeatureState(id, feature);
  
  if (currentState.enabled === enabled) return;

  stateMap[id] = {
    ...currentState,
    enabled
  };

  await game.settings.set("endless-assistant", "featureState", stateMap);
}

/**
 * Установка видимости функции для игроков (только ГМ)
 * @param {string} id 
 * @param {boolean} flag 
 */
export async function setFeatureVisibleToPlayers(id, flag) {
  if (!canOpenGM()) {
    throw new Error(game.i18n.localize("ENDLESS.errors.gmOnly"));
  }

  const feature = registry.get(id);
  if (!feature) {
    throw new Error(`Feature with id "${id}" not found.`);
  }

  // Не мутируем объект из game.settings.get: клонируем через foundry.utils.deepClone
  const rawState = game.settings.get("endless-assistant", "featureState") || {};
  const stateMap = foundry.utils.deepClone(rawState);
  const currentState = getFeatureState(id, feature);

  if (currentState.visibleToPlayers === flag) return;

  stateMap[id] = {
    ...currentState,
    visibleToPlayers: flag
  };

  await game.settings.set("endless-assistant", "featureState", stateMap);
}
