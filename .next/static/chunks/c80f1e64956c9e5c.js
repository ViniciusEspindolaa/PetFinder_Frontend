(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,59769,t=>{"use strict";var e=t.i(1972),i=t.i(75305),n=t.i(47222),l=t.i(17551),a=t.i(3617),r=t.i(35354),o=t.i(17626);function s({latitude:t,longitude:s,onChange:c,className:d}){let p,m;i.default.useEffect(()=>{let t="leaflet-css";if(!document.getElementById(t)){let e=document.createElement("link");e.id=t,e.rel="stylesheet",e.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",e.crossOrigin="",document.head.appendChild(e);let i="leaflet-selectable-custom";if(!document.getElementById(i)){let t=document.createElement("style");t.id=i,t.innerHTML=`
          .custom-div-icon, .leaflet-marker-icon.custom-div-icon {
            background: transparent !important;
            border: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            padding: 0 !important;
          }
          .custom-div-icon svg { width: 36px; height: 36px; display: block; }
        `,document.head.appendChild(t)}}},[]);let u=i.default.useMemo(()=>t&&s?[t,s]:[-23.55,-46.63],[t,s]);return(0,e.jsx)("div",{className:d||"w-full h-64",children:(0,e.jsxs)(n.MapContainer,{center:u,zoom:13,style:{height:"100%",width:"100%"},children:[(0,e.jsx)(l.TileLayer,{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}),(0,e.jsx)(function(){return(0,r.useMapEvents)({click(t){let{lat:e,lng:i}=t.latlng;c(e,i)}}),null},{}),t&&s&&(p=`
            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="pin">
              <path d="M18 2 C12 2 8 6 8 12 C8 20 18 32 18 32 C18 32 28 20 28 12 C28 6 24 2 18 2 Z" fill="#2563eb" stroke="#ffffff" stroke-width="1.2" />
              <circle cx="18" cy="12" r="4" fill="#ffffff" />
            </svg>
          `,m=o.default.divIcon({html:p,className:"custom-div-icon",iconSize:[36,36],iconAnchor:[18,34]}),(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(function({lat:t,lng:e}){let n=(0,r.useMap)();return i.default.useEffect(()=>{if(t&&e)try{n.flyTo([t,e],14,{duration:.6})}catch(t){}},[t,e,n]),null},{lat:t,lng:s}),(0,e.jsx)(a.Marker,{position:[t,s],icon:m,draggable:!0,eventHandlers:{dragend(t){let{lat:e,lng:i}=t.target.getLatLng();c(e,i)}}})]}))]})})}o.default.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"}),t.s(["default",()=>s])},78264,t=>{t.n(t.i(59769))}]);