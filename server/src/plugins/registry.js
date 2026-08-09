/**
 * Plugin Registry — core platform loads optional modules as plugins.
 * Industry-specific packs can register without bloating the core.
 */
class PluginRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    if (!plugin?.id || !plugin?.name) {
      throw new Error('Plugin must have id and name');
    }
    this.plugins.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      description: plugin.description || '',
      version: plugin.version || '1.0.0',
      enabled: plugin.enabled !== false,
      routes: plugin.routes || null,
      nav: plugin.nav || [],
      permissions: plugin.permissions || [],
      models: plugin.models || [],
    });
    return this;
  }

  get(id) {
    return this.plugins.get(id);
  }

  list() {
    return Array.from(this.plugins.values());
  }

  enabled() {
    return this.list().filter((p) => p.enabled);
  }

  mount(app, authenticate) {
    for (const plugin of this.enabled()) {
      if (plugin.routes) {
        app.use(`/api/${plugin.id}`, authenticate, plugin.routes);
      }
    }
  }

  setEnabled(id, enabled) {
    const p = this.plugins.get(id);
    if (!p) return null;
    p.enabled = Boolean(enabled);
    return p;
  }
}

module.exports = new PluginRegistry();
