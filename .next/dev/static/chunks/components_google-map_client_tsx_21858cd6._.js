(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/google-map.client.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GoogleMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.3_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.3_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.3_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.3_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const STATUS_COLORS = {
    lost: '#ef4444',
    found: '#3b82f6',
    adoption: '#10b981',
    default: '#6b7280'
};
function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        if (window.google && window.google.maps) return resolve();
        const id = 'google-maps-script';
        if (document.getElementById(id)) {
            // wait for it to be ready
            const check = setInterval(()=>{
                if (window.google && window.google.maps) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
            return;
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onload = ()=>resolve();
        script.onerror = (e)=>reject(e);
        document.head.appendChild(script);
    });
}
function GoogleMap({ pets = [], selectedPetId, onPetSelect, statusFilter = 'all' }) {
    _s();
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const markersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const apiKey = ("TURBOPACK compile-time value", "AIzaSyDHX74ZNeuQ3kpXSyMsmp2dXgIjtQMnyV0") || '';
    const [legendOpen, setLegendOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GoogleMap.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            let mounted = true;
            loadGoogleMaps(apiKey).then({
                "GoogleMap.useEffect": ()=>{
                    if (!mounted) return;
                    if (!mapRef.current) return;
                    // init map if not already
                    if (!mapInstance.current) {
                        mapInstance.current = new window.google.maps.Map(mapRef.current, {
                            center: {
                                lat: -23.55,
                                lng: -46.63
                            },
                            zoom: 12,
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: false
                        });
                    }
                // initial markers render handled in separate effect
                }
            }["GoogleMap.useEffect"]).catch({
                "GoogleMap.useEffect": (e)=>console.error('Erro ao carregar Google Maps', e)
            }["GoogleMap.useEffect"]);
            return ({
                "GoogleMap.useEffect": ()=>{
                    mounted = false;
                }
            })["GoogleMap.useEffect"];
        }
    }["GoogleMap.useEffect"], [
        apiKey
    ]);
    // Build markers when pets or filter changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GoogleMap.useEffect": ()=>{
            const map = mapInstance.current;
            if (!map) return;
            // clear existing markers
            markersRef.current.forEach({
                "GoogleMap.useEffect": (m)=>m.marker && m.marker.setMap(null)
            }["GoogleMap.useEffect"]);
            markersRef.current = [];
            const normalized = (pets || []).map({
                "GoogleMap.useEffect.normalized": (p)=>{
                    // try multiple possible shapes for coordinates and coerce to numbers
                    const tryVals = {
                        "GoogleMap.useEffect.normalized.tryVals": (v)=>{
                            if (v == null) return null;
                            if (typeof v === 'number') return v;
                            if (typeof v === 'string') {
                                const n = parseFloat(v);
                                return Number.isFinite(n) ? n : null;
                            }
                            return null;
                        }
                    }["GoogleMap.useEffect.normalized.tryVals"];
                    const latCandidates = [
                        p?.location?.lat,
                        p?.location?.latitude,
                        p?.localizacao?.latitude,
                        p?.localizacao?.lat,
                        p?.lat
                    ];
                    const lngCandidates = [
                        p?.location?.lng,
                        p?.location?.longitude,
                        p?.localizacao?.longitude,
                        p?.localizacao?.lng,
                        p?.lng
                    ];
                    let lat = null;
                    let lng = null;
                    for (const c of latCandidates){
                        const v = tryVals(c);
                        if (v != null) {
                            lat = v;
                            break;
                        }
                    }
                    for (const c of lngCandidates){
                        const v = tryVals(c);
                        if (v != null) {
                            lng = v;
                            break;
                        }
                    }
                    return {
                        id: p.id,
                        nome: p.name || p.nome || 'Pet',
                        lat,
                        lng,
                        photo: Array.isArray(p.fotos_urls) && p.fotos_urls.length ? p.fotos_urls[0] : p.photoUrl,
                        raw: p,
                        status: p.status
                    };
                }
            }["GoogleMap.useEffect.normalized"]).filter({
                "GoogleMap.useEffect.normalized": (m)=>typeof m.lat === 'number' && typeof m.lng === 'number'
            }["GoogleMap.useEffect.normalized"]).filter({
                "GoogleMap.useEffect.normalized": (m)=>{
                    if (statusFilter === 'all') return true;
                    if (statusFilter === 'lost') return m.status === 'lost';
                    if (statusFilter === 'found') return m.status === 'found';
                    if (statusFilter === 'adoption') return m.status === 'adoption';
                    return true;
                }
            }["GoogleMap.useEffect.normalized"]);
            // debug: inspecionar normalização dos pets para confirmar lat/lng
            try {
                console.debug('[GoogleMap] normalized markers:', normalized);
            } catch (e) {}
            // create markers
            normalized.forEach({
                "GoogleMap.useEffect": (m)=>{
                    const color = STATUS_COLORS[m.status || 'default'] || STATUS_COLORS.default;
                    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' + '<path d="M18 2 C12 2 8 6 8 12 C8 20 18 32 18 32 C18 32 28 20 28 12 C28 6 24 2 18 2 Z" fill="' + color + '" stroke="#ffffff" stroke-width="1.2"/>' + '<circle cx="18" cy="12" r="4" fill="#ffffff" />' + '</svg>';
                    const svg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent);
                    const marker = new window.google.maps.Marker({
                        position: {
                            lat: Number(m.lat),
                            lng: Number(m.lng)
                        },
                        map,
                        title: m.nome,
                        icon: {
                            url: svg,
                            scaledSize: new window.google.maps.Size(36, 36),
                            anchor: new window.google.maps.Point(18, 34)
                        }
                    });
                    // create a DOM node for the info window to avoid template parsing issues
                    const contentNode = document.createElement('div');
                    contentNode.style.maxWidth = '240px';
                    const titleEl = document.createElement('strong');
                    titleEl.textContent = m.nome;
                    contentNode.appendChild(titleEl);
                    const racaEl = document.createElement('div');
                    racaEl.style.marginTop = '6px';
                    racaEl.textContent = m.raw && m.raw.raca || '';
                    contentNode.appendChild(racaEl);
                    const actionWrap = document.createElement('div');
                    actionWrap.style.textAlign = 'right';
                    actionWrap.style.marginTop = '8px';
                    const btn = document.createElement('button');
                    btn.setAttribute('data-id', m.id);
                    btn.style.background = '#0ea5a4';
                    btn.style.color = '#fff';
                    btn.style.padding = '6px 8px';
                    btn.style.border = 'none';
                    btn.style.borderRadius = '6px';
                    btn.style.cursor = 'pointer';
                    btn.textContent = 'Ver mais';
                    actionWrap.appendChild(btn);
                    contentNode.appendChild(actionWrap);
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: contentNode
                    });
                    marker.addListener('click', {
                        "GoogleMap.useEffect": ()=>{
                            infoWindow.open(map, marker);
                        }
                    }["GoogleMap.useEffect"]);
                    // delegate click on button
                    btn.onclick = ({
                        "GoogleMap.useEffect": ()=>{
                            try {
                                router.push(`/pet/${m.id}`);
                            } catch (e) {
                                window.location.href = `/pet/${m.id}`;
                            }
                        }
                    })["GoogleMap.useEffect"];
                    markersRef.current.push({
                        id: m.id,
                        marker,
                        infoWindow
                    });
                }
            }["GoogleMap.useEffect"]);
            // If no markers were created from data, add a temporary test marker so
            // developer can confirm marker rendering works. This is safe to keep
            // temporarily and will not affect production data.
            if (markersRef.current.length === 0) {
                try {
                    const testPos = {
                        lat: -23.55,
                        lng: -46.63
                    };
                    const testSvgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' + '<path d="M18 2 C12 2 8 6 8 12 C8 20 18 32 18 32 C18 32 28 20 28 12 C28 6 24 2 18 2 Z" fill="#ff00aa" stroke="#ffffff" stroke-width="1.2"/>' + '<circle cx="18" cy="12" r="4" fill="#ffffff" />' + '</svg>';
                    const testIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent(testSvgContent);
                    const testMarker = new window.google.maps.Marker({
                        position: testPos,
                        map,
                        title: 'Marcador de teste',
                        icon: {
                            url: testIcon,
                            scaledSize: new window.google.maps.Size(36, 36),
                            anchor: new window.google.maps.Point(18, 34)
                        }
                    });
                    const info = new window.google.maps.InfoWindow({
                        content: '<div style="max-width:200px">Marcador de teste (remova depois)</div>'
                    });
                    testMarker.addListener('click', {
                        "GoogleMap.useEffect": ()=>info.open(map, testMarker)
                    }["GoogleMap.useEffect"]);
                    markersRef.current.push({
                        id: 'test-marker',
                        marker: testMarker,
                        infoWindow: info
                    });
                    try {
                        console.info('[GoogleMap] marcador de teste adicionado');
                    } catch (e) {}
                } catch (e) {
                // ignore any errors when adding test marker
                }
            }
            // center map if selectedPetId present
            if (selectedPetId) {
                const found = markersRef.current.find({
                    "GoogleMap.useEffect.found": (x)=>x.id === selectedPetId
                }["GoogleMap.useEffect.found"]);
                if (found) {
                    map.panTo(found.marker.getPosition());
                    map.setZoom(14);
                    // open info window
                    found.infoWindow.open(map, found.marker);
                }
            } else if (markersRef.current.length) {
                // fit bounds
                const bounds = new window.google.maps.LatLngBounds();
                markersRef.current.forEach({
                    "GoogleMap.useEffect": (m)=>bounds.extend(m.marker.getPosition())
                }["GoogleMap.useEffect"]);
                map.fitBounds(bounds);
            }
        }
    }["GoogleMap.useEffect"], [
        pets,
        statusFilter,
        selectedPetId
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: mapRef,
                style: {
                    width: '100%',
                    height: '100%',
                    minHeight: 360
                }
            }, void 0, false, {
                fileName: "[project]/components/google-map.client.tsx",
                lineNumber: 290,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-3 right-3 z-50 text-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:block bg-white/95 text-gray-900 rounded shadow-md p-2 pointer-events-auto border border-gray-200",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-block w-4 h-4",
                                            style: {
                                                background: STATUS_COLORS.lost
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/google-map.client.tsx",
                                            lineNumber: 295,
                                            columnNumber: 54
                                        }, this),
                                        " Perdido"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/google-map.client.tsx",
                                    lineNumber: 295,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-block w-4 h-4",
                                            style: {
                                                background: STATUS_COLORS.found
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/google-map.client.tsx",
                                            lineNumber: 296,
                                            columnNumber: 54
                                        }, this),
                                        " Encontrado"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/google-map.client.tsx",
                                    lineNumber: 296,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-block w-4 h-4",
                                            style: {
                                                background: STATUS_COLORS.adoption
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/google-map.client.tsx",
                                            lineNumber: 297,
                                            columnNumber: 54
                                        }, this),
                                        " Adoção"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/google-map.client.tsx",
                                    lineNumber: 297,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/google-map.client.tsx",
                            lineNumber: 294,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/google-map.client.tsx",
                        lineNumber: 293,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sm:hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            "aria-label": "Legenda",
                            onClick: ()=>setLegendOpen((v)=>!v),
                            className: "bg-white/95 text-gray-900 p-2 rounded-full shadow-md border border-gray-200",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "18",
                                height: "18",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                xmlns: "http://www.w3.org/2000/svg",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "6",
                                        cy: "6",
                                        r: "3",
                                        fill: "#ef4444"
                                    }, void 0, false, {
                                        fileName: "[project]/components/google-map.client.tsx",
                                        lineNumber: 303,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "12",
                                        cy: "6",
                                        r: "3",
                                        fill: "#3b82f6"
                                    }, void 0, false, {
                                        fileName: "[project]/components/google-map.client.tsx",
                                        lineNumber: 304,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "18",
                                        cy: "6",
                                        r: "3",
                                        fill: "#10b981"
                                    }, void 0, false, {
                                        fileName: "[project]/components/google-map.client.tsx",
                                        lineNumber: 305,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/google-map.client.tsx",
                                lineNumber: 302,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/google-map.client.tsx",
                            lineNumber: 301,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/google-map.client.tsx",
                        lineNumber: 300,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/google-map.client.tsx",
                lineNumber: 292,
                columnNumber: 7
            }, this),
            legendOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-4 right-4 z-50 bg-white/95 text-gray-900 rounded shadow-md p-3 w-40 border border-gray-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setLegendOpen(false),
                                className: "text-xs text-gray-600",
                                children: "Fechar"
                            }, void 0, false, {
                                fileName: "[project]/components/google-map.client.tsx",
                                lineNumber: 314,
                                columnNumber: 47
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/google-map.client.tsx",
                            lineNumber: 314,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block w-4 h-4",
                                    style: {
                                        background: STATUS_COLORS.lost
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/google-map.client.tsx",
                                    lineNumber: 315,
                                    columnNumber: 54
                                }, this),
                                " Perdido"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/google-map.client.tsx",
                            lineNumber: 315,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block w-4 h-4",
                                    style: {
                                        background: STATUS_COLORS.found
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/google-map.client.tsx",
                                    lineNumber: 316,
                                    columnNumber: 54
                                }, this),
                                " Encontrado"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/google-map.client.tsx",
                            lineNumber: 316,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block w-4 h-4",
                                    style: {
                                        background: STATUS_COLORS.adoption
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/google-map.client.tsx",
                                    lineNumber: 317,
                                    columnNumber: 54
                                }, this),
                                " Adoção"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/google-map.client.tsx",
                            lineNumber: 317,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/google-map.client.tsx",
                    lineNumber: 313,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/google-map.client.tsx",
                lineNumber: 312,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/google-map.client.tsx",
        lineNumber: 289,
        columnNumber: 5
    }, this);
}
_s(GoogleMap, "KKWYUMaLs90iNBf2REZHdIQI4vE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = GoogleMap;
var _c;
__turbopack_context__.k.register(_c, "GoogleMap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/google-map.client.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/google-map.client.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=components_google-map_client_tsx_21858cd6._.js.map