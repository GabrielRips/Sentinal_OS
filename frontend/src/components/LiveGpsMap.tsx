"use client";
// @ts-nocheck

import { type ComponentType, useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

interface Coordinates {
  lat: number;
  lng: number;
}

interface LiveGpsMapProps {
  currentPosition: Coordinates | null;
  homePosition: Coordinates | null;
  flightPath: [number, number][];
}

const FALLBACK_CENTER: [number, number] = [48.8566, 2.3522];
const LeafletMapContainer = MapContainer as unknown as ComponentType<Record<string, unknown>>;
const LeafletTileLayer = TileLayer as unknown as ComponentType<Record<string, unknown>>;
const LeafletPolyline = Polyline as unknown as ComponentType<Record<string, unknown>>;
const LeafletCircleMarker = CircleMarker as unknown as ComponentType<Record<string, unknown>>;

function RecenterMap({ currentPosition }: { currentPosition: Coordinates | null }) {
  const map = useMap();

  useEffect(() => {
    if (!currentPosition) return;
    map.setView([currentPosition.lat, currentPosition.lng], Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 0.6,
    });
  }, [currentPosition, map]);

  return null;
}

export default function LiveGpsMap({
  currentPosition,
  homePosition,
  flightPath,
}: LiveGpsMapProps) {
  const center = currentPosition
    ? ([currentPosition.lat, currentPosition.lng] as [number, number])
    : homePosition
      ? ([homePosition.lat, homePosition.lng] as [number, number])
      : FALLBACK_CENTER;

  const initialBounds: [[number, number], [number, number]] = [
    [center[0] - 0.0015, center[1] - 0.0015],
    [center[0] + 0.0015, center[1] + 0.0015],
  ];

  return (
    <LeafletMapContainer
      bounds={initialBounds}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <LeafletTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <RecenterMap currentPosition={currentPosition} />

      {flightPath.length > 1 && (
        <LeafletPolyline
          positions={flightPath}
          pathOptions={{
            color: "#A3ADBC",
            weight: 2,
            opacity: 0.75,
          }}
        />
      )}

      {homePosition && (
        <LeafletCircleMarker
          center={[homePosition.lat, homePosition.lng]}
          radius={6}
          pathOptions={{
            color: "#22C55E",
            fillColor: "#22C55E",
            fillOpacity: 0.2,
            weight: 1,
          }}
        />
      )}

      {currentPosition && (
        <>
          <LeafletCircleMarker
            center={[currentPosition.lat, currentPosition.lng]}
            radius={12}
            pathOptions={{
              color: "#CDFF00",
              fillColor: "#CDFF00",
              fillOpacity: 0.18,
              weight: 1,
            }}
          />
          <LeafletCircleMarker
            center={[currentPosition.lat, currentPosition.lng]}
            radius={5}
            pathOptions={{
              color: "#CDFF00",
              fillColor: "#CDFF00",
              fillOpacity: 0.95,
              weight: 1,
            }}
          />
        </>
      )}
    </LeafletMapContainer>
  );
}
