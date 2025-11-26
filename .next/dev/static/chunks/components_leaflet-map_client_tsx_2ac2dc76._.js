(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/leaflet-map.client.tsx [app-client] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules__pnpm_629ec5d0._.js",
  "static/chunks/components_leaflet-map_client_tsx_45248aef._.js",
  {
    "path": "static/chunks/9f915_leaflet_dist_leaflet_9d71ccf4.css",
    "included": [
      "[project]/node_modules/.pnpm/leaflet@1.9.4/node_modules/leaflet/dist/leaflet.css [app-client] (css)"
    ]
  },
  "static/chunks/components_leaflet-map_client_tsx_3a649414._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/components/leaflet-map.client.tsx [app-client] (ecmascript, next/dynamic entry)");
    });
});
}),
]);