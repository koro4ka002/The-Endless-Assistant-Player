/**
 * Роутер и управление доступом к оболочкам ассистента
 */

const registeredShells = {
  gm: null,
  player: null
};

const shellInstances = {
  gm: null,
  player: null
};

/**
 * Проверка, может ли текущий пользователь открывать функции ГМа (без использования game.user.isGM)
 */
export function canOpenGM() {
  const userRole = game.user.role;
  const gmRole = CONST.USER_ROLES?.GAMEMASTER ?? 4;
  const assistantRole = CONST.USER_ROLES?.ASSISTANT ?? 3;

  if (userRole >= gmRole) return true;
  if (userRole === assistantRole) {
    return game.settings.get("endless-assistant", "allowAssistantGM");
  }
  return false;
}

/**
 * Определение текущей роли ассистента для пользователя
 */
export function role() {
  return canOpenGM() ? "gm" : "player";
}

/**
 * Регистрация оболочки
 * @param {Object} param0 { role: "gm" | "player", load: async () => ApplicationV2 }
 */
export function registerShell({ role: shellRole, load }) {
  if (shellRole !== "gm" && shellRole !== "player") {
    console.error(`Endless Assistant | Invalid shell role: ${shellRole}`);
    return;
  }
  if (typeof load !== "function") {
    console.error(`Endless Assistant | Shell load must be a function for role: ${shellRole}`);
    return;
  }
  if (registeredShells[shellRole]) {
    console.warn(`Endless Assistant | Shell for role ${shellRole} is already registered. Overwriting.`);
  }
  registeredShells[shellRole] = load;
  shellInstances[shellRole] = null;
}

/**
 * Открытие оболочки ассистента
 */
export async function open() {
  const currentRole = role();

  if (currentRole === "gm" && !canOpenGM()) {
    ui.notifications.warn(game.i18n.localize("ENDLESS.errors.noAccess"));
    return;
  }

  const loadFn = registeredShells[currentRole];
  if (!loadFn) {
    ui.notifications.info(game.i18n.localize("ENDLESS.info.noShellRegistered"));
    return;
  }

  const existingInstance = shellInstances[currentRole];
  if (existingInstance && existingInstance.rendered) {
    existingInstance.bringToFront();
    return;
  }

  try {
    const ShellClass = await loadFn();
    if (ShellClass) {
      const app = new ShellClass();
      shellInstances[currentRole] = app;
      app.render(true);
    }
  } catch (err) {
    console.error(`Endless Assistant | Error opening shell for role ${currentRole}:`, err);
    ui.notifications.error(game.i18n.localize("ENDLESS.errors.openFailed"));
  }
}
