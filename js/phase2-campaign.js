/* Carry only approved, fixed public campaign labels to the new Phase2 pages.
   No storage, network calls, identifiers, search input or feedback access. */
(() => {
  'use strict';
  const config = window.SuzumeAnalyticsConfig;
  if (!config || location.origin !== config.origin) return;
  const url = new URL(location.href), keys = [...url.searchParams.keys()];
  if (url.hash || keys.length !== 3 || new Set(keys).size !== 3 || keys.some(k => !['utm_source','utm_medium','utm_campaign'].includes(k))) return;
  const tuple = (config.campaignTuples || []).find(t => t.name === url.searchParams.get('utm_campaign') && t.source === url.searchParams.get('utm_source') && t.medium === url.searchParams.get('utm_medium'));
  if (!tuple) return;
  function decorate() {
    document.querySelectorAll('a[href]').forEach(a => {
      const dest = new URL(a.getAttribute('href'), location.href);
      if (dest.origin !== config.origin || dest.hash || dest.search || !Object.hasOwn(config.pages, dest.pathname) || !/^\/japan-life-explained\/(?:languages\.html|(?:ne|id)\/(?:index\.html|articles\/[a-z0-9-]+\.html))$/.test(dest.pathname)) return;
      dest.searchParams.set('utm_source', tuple.source);dest.searchParams.set('utm_medium', tuple.medium);dest.searchParams.set('utm_campaign', tuple.name);
      a.href = dest.href;
    });
  }
  decorate();
})();
