"use client";
import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapaUbicacion({ lat, lng, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import("leaflet").then(L => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png", iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png", shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png" });
      const map = L.map(mapRef.current!, { center: [lat || -33.4489, lng || -70.6693], zoom: 15 });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "© CartoDB" }).addTo(map);
      const marker = L.marker([lat || -33.4489, lng || -70.6693], { draggable: true }).addTo(map);
      marker.on("dragend", () => { const p = marker.getLatLng(); onChange(p.lat, p.lng); });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => { marker.setLatLng(e.latlng); onChange(e.latlng.lat, e.latlng.lng); });
      mapInstance.current = map;
      markerRef.current = marker;
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map when lat/lng change from outside (e.g. address search)
  useEffect(() => {
    if (!mapInstance.current || !markerRef.current) return;
    if (!lat || !lng) return;
    const currentPos = markerRef.current.getLatLng();
    // Only move if position actually changed
    if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstance.current.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng]);

  return (
    <div style={{ marginBottom: "8px" }}>
      <div ref={mapRef} style={{ height: "220px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(232,168,76,0.2)" }} />
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.25)", marginTop: "6px" }}>📍 Click en el mapa o arrastra el pin para ajustar la ubicación</p>
    </div>
  );
}
