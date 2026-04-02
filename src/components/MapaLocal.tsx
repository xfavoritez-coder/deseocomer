"use client";
import { useEffect, useRef } from "react";

interface MapaLocalProps {
  lat: number;
  lng: number;
  nombre: string;
}

function isDay(): boolean {
  const h = new Date().getHours();
  return h >= 7 && h < 20;
}

export default function MapaLocal({ lat, lng, nombre }: MapaLocalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      const tileUrl = isDay()
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      const iconoDorado = L.divIcon({
        html: `
          <div style="
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #e8a84c, #c4853a);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #f5d080;
            box-shadow: 0 0 12px rgba(232,168,76,0.6);
          ">
            <div style="
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
              font-size: 14px;
            ">🍽️</div>
          </div>
        `,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      L.marker([lat, lng], { icon: iconoDorado })
        .addTo(map)
        .bindPopup(`
          <div style="
            font-family: sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: #1a0e05;
            padding: 4px 8px;
          ">
            📍 ${nombre}
          </div>
        `)
        .openPopup();

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, nombre]);

  return (
    <>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "220px",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid rgba(232,168,76,0.2)",
          zIndex: 1,
        }}
      />
      <style>{`
        .leaflet-container {
          background: ${isDay() ? "#f0ece4" : "#0d0d0d"} !important;
          border-radius: 12px;
          z-index: 1 !important;
        }
        .leaflet-popup {
          z-index: 10 !important;
        }
        .leaflet-popup-content-wrapper {
          background: #f5d080;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .leaflet-popup-tip {
          background: #f5d080;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(232,168,76,0.3) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: rgba(13,7,3,0.95) !important;
          color: #e8a84c !important;
          border-color: rgba(232,168,76,0.2) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(232,168,76,0.15) !important;
        }
      `}</style>
    </>
  );
}
