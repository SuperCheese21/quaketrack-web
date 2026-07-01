// Basemap styling that follows the app's light/dark theme. CARTO offers a
// matched pair of raster styles; `{r}` yields retina (@2x) tiles.
export const cartoTileUrl = (isDark: boolean): string =>
  `https://{s}.basemaps.cartocdn.com/${
    isDark ? 'dark_all' : 'light_all'
  }/{z}/{x}/{y}{r}.png`;

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Plate-boundary lines: light gray reads on the dark basemap, near-black on the
// light one.
export const plateBoundaryColor = (isDark: boolean): string =>
  isDark ? '#9ca3af' : '#111827';
