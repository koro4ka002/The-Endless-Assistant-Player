const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PlayerShell extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.activeTab = "home";
  }

  static DEFAULT_OPTIONS = {
    id: "endless-assistant-player-shell",
    tag: "div",
    classes: ["ea-root", "ea-player-shell-window"],
    window: {
      title: "ENDLESS.player.title",
      icon: "fa-solid fa-compass",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 780,
      height: 500
    },
    actions: {
      switchTab: PlayerShell.prototype._onSwitchTab
    }
  };

  static PARTS = {
    shell: {
      template: "modules/endless-assistant-player/templates/shell.hbs"
    }
  };

  _canRender(options) {
    const api = game.modules.get("endless-assistant")?.api;
    if (!api) {
      return false;
    }
    return super._canRender(options);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const api = game.modules.get("endless-assistant")?.api;

    if (!api) {
      return {
        isHome: true,
        isFeature: false,
        features: []
      };
    }

    const playerFeatures = api.features.list("player");
    
    const validTabs = ["home", ...playerFeatures.map(f => f.id)];
    if (!validTabs.includes(this.activeTab)) {
      this.activeTab = "home";
    }

    const featuresWithActive = playerFeatures.map(f => ({
      ...f,
      isActive: this.activeTab === f.id
    }));

    context.isHome = this.activeTab === "home";
    context.isFeature = !context.isHome;
    context.activeTab = this.activeTab;
    context.features = featuresWithActive;

    return context;
  }

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    this.boundHandleFeatureChanged = this._onFeatureChanged.bind(this);
    Hooks.on("endlessAssistant.featureChanged", this.boundHandleFeatureChanged);
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const api = game.modules.get("endless-assistant")?.api;
    if (!api) return;

    const html = this.element;
    if (!html) return;

    if (context.isFeature) {
      const mount = html.querySelector(`.ea-player-feature-mount[data-feature-id="${this.activeTab}"]`);
      if (mount) {
        const playerFeatures = api.features.list("player");
        const feature = playerFeatures.find(f => f.id === this.activeTab);
        if (feature && typeof feature.render === "function") {
          try {
            feature.render(mount, { role: "player" });
          } catch (err) {
            console.error(`PlayerShell | Error rendering feature ${this.activeTab}:`, err);
          }
        }
      }
    }
  }

  _onFeatureChanged({ id }) {
    if (this.rendered) {
      this.render();
    }
  }

  async _onSwitchTab(event, target) {
    const tab = target.getAttribute("data-tab");
    if (tab) {
      this.activeTab = tab;
      this.render();
    }
  }

  async close(options) {
    if (this.boundHandleFeatureChanged) {
      Hooks.off("endlessAssistant.featureChanged", this.boundHandleFeatureChanged);
      this.boundHandleFeatureChanged = null;
    }
    return super.close(options);
  }
}
