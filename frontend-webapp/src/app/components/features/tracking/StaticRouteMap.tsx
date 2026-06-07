'use client';

/**
 * StaticRouteMap — miniatura de mapa con la ruta (Static Images API).
 *
 * Liviana: es una imagen PNG generada por Mapbox, sin cargar el mapa GL.
 * Ideal para tarjetas de historial y comprobantes. Muestra pin verde (origen)
 * y pin rojo (destino) y ajusta el encuadre automáticamente.
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props {
  pickup?: { lat: number; lon: number };
  dropoff?: { lat: number; lon: number };
  width?: number;
  height?: number;
  className?: string;
}

export function StaticRouteMap({ pickup, dropoff, width = 600, height = 240, className }: Props) {
  const hasCoords = !!(MAPBOX_TOKEN && pickup?.lat && dropoff?.lat);

  if (!hasCoords) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center text-gray-300 ${className ?? ''}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <span className="text-2xl">🗺️</span>
      </div>
    );
  }

  const pins = `pin-s+22c55e(${pickup!.lon},${pickup!.lat}),pin-s+ef4444(${dropoff!.lon},${dropoff!.lat})`;
  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins}/auto/${width}x${height}@2x`
    + `?padding=40&access_token=${MAPBOX_TOKEN}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Mapa de la ruta"
      width={width}
      height={height}
      loading="lazy"
      className={className}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}
