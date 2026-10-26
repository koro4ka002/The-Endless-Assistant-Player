/**
 * Добавление кнопки ассистента в панель управления сценой (Foundry v14 API)
 */
import { open } from "./router.js";

export function registerControls() {
  Hooks.on("getSceneControlButtons", (controls) => {
    // В v14 controls — это объект (Record<string, SceneControl>), а не массив
    controls["endless-assistant"] = {
      name: "endless-assistant",
      title: game.i18n.localize("ENDLESS.controls.title"),
      icon: "fa-solid fa-train-subway",
      visible: true,
      tools: {
        open: {
          name: "open",
          title: game.i18n.localize("ENDLESS.controls.open"),
          icon: "fa-solid fa-book-open",
          button: true,
          visible: true,
          onChange: () => open()
        }
      },
      activeTool: "open"
    };
  });
}
