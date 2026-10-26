\# PROJECT.md: паспорт проекта (читай полностью перед любой задачей)



\## Что делаем

Полностью свою систему и набор модулей для Foundry VTT v14 по настольной ролевой игре «Бесконечный поезд». Бренд ассистента: «The Endless Assistant». Интерфейс только на русском. Стиль: «потёртый стимпанк» (тёмный металл, латунь, клёпки), навигация простыми русскими словами, без «поездной» терминологии в текстах.



\## Пакеты (у каждого свой репозиторий, module.json лежит в корне репозитория)

\- The-Endless-Assistant: ядро, id endless-assistant (v0.1 готово)

\- The-Endless-Assistant-GM: оболочка ГМа, id endless-assistant-gm

\- The-Endless-Assistant-Player: оболочка игрока, id endless-assistant-player

\- плагины: по репозиторию на плагин

\- система endless-train: позже

Локально папка пакета кладётся в Data/modules/<id>/. Код ядра лежит в соседнем репозитории, не копируй его.



\## Жёсткие правила кода

1\. Только ES-модули. Без сборщиков, npm и внешних библиотек.

2\. Окна: ApplicationV2 с HandlebarsApplicationMixin (точные имена сверяй с API v14).

3\. Источник правды по API: официальная документация https://foundryvtt.com/api/ . Если не уверен в имени метода или хука, напиши «НЕ УВЕРЕН» и объясни. Не выдумывай API.

4\. Ни одной строки интерфейса в коде: только game.i18n.localize("ENDLESS....") и lang/ru.json.

5\. CSS: классы только с префиксом ea-, цвета и шрифты только через переменные --ea-\*, без !important. Корневой элемент каждого окна ассистента имеет класс ea-root, стили скоупятся внутри него.

6\. Секреты ГМа никогда не кладём в game.settings (world-настройки видны всем клиентам). Только в документы с доступом «только ГМ». Проверка роли делается в начале каждого действия, а не только скрытием кнопки.
6а. Любая проверка роли на клиенте (game.user.role, canOpenGM) нужна для удобства и обходится локально. Поэтому:
(1) данные ГМа хранятся только в документах с доступом «только ГМ» (ownership.default = NONE) и никогда не в game.settings world-scope;
(2) действия ГМа выполняются на клиенте ГМа или защищены правами Foundry; запросы игроков по сокету ГМ принимает только с проверкой роли отправителя по game.users;
(3) id функций ГМа делай нейтральными (например, "gm-tool-07"), потому что они видны всем клиентам в featureState.
7\. Не меняй файлы вне своей зоны и не меняй контракт ниже. Если контракт мешает, остановись и опиши проблему.

8\. Комментарии в коде по-русски, короткие.



\## Контракт API ядра (менять нельзя)

Доступ: game.modules.get("endless-assistant").api

Ядро в своём init-хуке создаёт api и вызывает Hooks.callAll("endlessAssistant.init", api). Остальные модули подписываются на верхнем уровне своего скрипта: Hooks.once("endlessAssistant.init", api => ...).



api.role()          -> "gm" | "player"

api.canOpenGM()     -> boolean (ГМ; помощник ГМа только если включена настройка allowAssistantGM)

api.open()          -> открывает оболочку по роли; игроку никогда не открывает оболочку ГМа

api.registerShell({ role, load })

&#x20;   role: "gm" | "player"; load: async () => класс ApplicationV2 оболочки

&#x20;   Ядро вызывает load() для "gm" только после canOpenGM()

api.registerFeature({ id, titleKey, descriptionKey, icon, audience, order, defaultEnabled, render, onEnable, onDisable })

&#x20;   audience: "gm" | "player" | "both"

&#x20;   icon: класс Font Awesome

&#x20;   render: async (container: HTMLElement, ctx: { role }) => void

&#x20;   visibleToPlayers по умолчанию true для audience "player"/"both", false для "gm"

api.features.list(role)                      -> включённые функции, видимые роли

&#x20;                                              (для "player": включена И открыта игрокам)

api.features.listAll()                       -> все функции с состоянием (только ГМ, иначе ошибка)

api.features.setEnabled(id, enabled)         (только ГМ, иначе ошибка)

api.features.setVisibleToPlayers(id, flag)   (только ГМ, иначе ошибка)

Событие: Hooks.callAll("endlessAssistant.featureChanged", { id }) срабатывает у ВСЕХ клиентов (ядро вызывает его из onChange настройки featureState). Оболочки перерисовываются по нему.

Состояние: world-настройка endless-assistant.featureState = { \[id]: { enabled, visibleToPlayers } }. Только флаги, без секретов.



\## Каталог CSS (определяет задача 4, используют все)

Классы: ea-root, ea-panel, ea-plate (табличка-заголовок), ea-button, ea-toggle, ea-nav, ea-nav\_\_item (.is-active), ea-list, ea-list\_\_row, ea-empty

Переменные: --ea-bg, --ea-bg-raised, --ea-border, --ea-text, --ea-text-muted, --ea-brass, --ea-copper, --ea-patina, --ea-ivory, --ea-danger, --ea-font-display, --ea-font-body, --ea-font-mono, --ea-radius

4) Раздел «Сомнения» не может быть пустым и не может говорить «всё выполнено». Перечисли, что ты НЕ мог проверить без запущенного Foundry (по пунктам «Как проверить»). Заявлять «проверено» можно только то, что реально запускалось.

\## Формат твоего ответа

1\) Полный отчёт запиши в файл reports/ЗАДАЧА-<номер>.md: список созданных и изменённых файлов, «Как проверить» (шаги в Foundry), «Сомнения».

2\) В терминал выведи только краткую сводку (до 10 строк) и путь к отчёту.

3\) Не вставляй в ответ полный код файлов, он уже лежит на диске.

