import L from 'leaflet';
import type { Place } from '../../db';
import { getCategoryMeta } from './placeCategories';

export function hasValidCoordinates(place: Place): boolean {
  return (
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng) &&
    (place.lat !== 0 || place.lng !== 0)
  );
}

export function createNumberedPinIcon(
  index: number,
  place: Place,
  isSelected: boolean
): L.DivIcon {
  const meta = getCategoryMeta(place.category);
  const size = isSelected ? 38 : 30;
  const ring = isSelected
    ? 'box-shadow: 0 0 0 4px rgba(0, 106, 106, 0.32), 0 4px 12px rgba(0,0,0,0.35);'
    : 'box-shadow: 0 2px 8px rgba(0,0,0,0.32);';

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${meta.color};
      color: #ffffff;
      border: 2.5px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', Inter, sans-serif;
      font-weight: 700;
      font-size: ${isSelected ? '15px' : '13px'};
      transition: all 0.15s ease;
      ${ring}
    ">
      ${index + 1}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'wayfarer-numbered-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
