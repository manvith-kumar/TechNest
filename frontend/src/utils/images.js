const palette = { 1: '#356DF3', 2: '#7866E8', 3: '#12A878', 4: '#F59E0B', 5: '#E5484D', 6: '#344B68', 7: '#2756CC', 8: '#101828' };

/** Inline SVG shown when a product image fails to load, so the layout never breaks. */
export function fallbackImage(label = 'TechNest', seed = 1) {
  const c = palette[(Number(seed) % 8) + 1] || '#356DF3';
  const text = String(label).slice(0, 22).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#EEF2F8"/><rect x="250" y="210" width="300" height="380" rx="36" fill="${c}" opacity=".14"/><rect x="290" y="250" width="220" height="250" rx="18" fill="${c}" opacity=".35"/><circle cx="400" cy="545" r="14" fill="${c}"/><text x="400" y="670" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="30" fill="#667085">${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ASSET_BASE = import.meta.env.VITE_ASSET_BASE || '';
export const resolveImage = (url) => (url && url.startsWith('/uploads/') ? `${ASSET_BASE}${url}` : url);
