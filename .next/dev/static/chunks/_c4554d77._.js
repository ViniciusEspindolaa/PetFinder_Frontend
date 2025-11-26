(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/leaflet-map.client.tsx [app-client] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_6d1b4002._.js",
  "static/chunks/components_leaflet-map_client_tsx_45248aef._.js",
  "static/chunks/components_leaflet-map_client_tsx_b299c809._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/components/leaflet-map.client.tsx [app-client] (ecmascript, next/dynamic entry)");
    });
});
}),
"[project]/node_modules/html2canvas/dist/html2canvas.js [app-client] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_html2canvas_dist_html2canvas_6fe6250c.js",
  "static/chunks/node_modules_html2canvas_dist_html2canvas_2a315040.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/html2canvas/dist/html2canvas.js [app-client] (ecmascript)");
    });
});
}),
]);