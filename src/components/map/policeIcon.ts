import L from 'leaflet'

const SHIELD_PATH = 'M12 2 4 5v6.2C4 17 7.6 21.4 12 22.6 16.4 21.4 20 17 20 11.2V5l-8-3z'
const STAR_PATH = 'm12 7.2 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5 1.5-3z'

/** Blue shield icon used for every police station marker. */
export const policeStationIcon = L.divIcon({
  className: 'crimemap-icon',
  html: `<div class="police-marker" role="img" aria-label="Police station"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SHIELD_PATH}"/><path d="${STAR_PATH}" fill="#1d4ed8"/></svg></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
})
