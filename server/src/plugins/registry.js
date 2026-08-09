/**
 * Plugin Registry — core platform loads optional modules as plugins.
 * Routes are lazy-loaded so Vercel cold starts stay under Hobby limits.
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
      loadRoutes: typeof plugin.loadRoutes === 'function' ? plugin.loadRoutes : null,
      nav: plugin.nav || [],
      permissions: plugin.permissions || [],
      models: plugin.models || [],
      _router: null,
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
      const base = `/api/${plugin.id}`;
      app.use(base, authenticate, (req, res, next) => {
        try {
          if (!plugin._router) {
            plugin._router = plugin.loadRoutes
              ? plugin.loadRoutes()
              : plugin.routes;
          }
          if (!plugin._router) {
            return res.status(404).json({ success: false, message: 'Plugin routes missing' });
          }
          return plugin._router(req, res, next);
        } catch (err) {
          return next(err);
        }
      });
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
