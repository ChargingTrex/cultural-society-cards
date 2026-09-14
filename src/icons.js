const svg = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  instagram: svg(
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none"/>',
  ),
  phone: svg(
    '<path d="M4.5 4h3.6l1.6 4-2 1.6a10.5 10.5 0 0 0 4.7 4.7l1.6-2 4 1.6v3.6a1.6 1.6 0 0 1-1.7 1.6A14.5 14.5 0 0 1 3 5.7 1.6 1.6 0 0 1 4.5 4z"/>',
  ),
  email: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>'),
  whatsapp: svg(
    '<path d="M6.5 17.5 4 19l1.6-3.4a7.7 7.7 0 1 1 4.9 2.7z"/><path d="M8.7 9.8c0 3.2 2.6 5.8 5.8 5.8"/>',
  ),
  linkedin: svg(
    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.3 10.2v7"/><circle cx="7.3" cy="7.1" r="0.9" fill="currentColor" stroke="none"/><path d="M11 17.2v-4.6a2.1 2.1 0 0 1 4.1 0v4.6"/>',
  ),
  link: svg(
    '<path d="M9.5 14.5 14.5 9.5"/><path d="M8.3 12.7A3.6 3.6 0 0 1 8.3 7l1.8-1.8a3.6 3.6 0 0 1 5.1 5.1l-.9.9"/><path d="M15.7 11.3a3.6 3.6 0 0 1 0 5.7l-1.8 1.8a3.6 3.6 0 0 1-5.1-5.1l.9-.9"/>',
  ),
  society: svg('<path d="M4.5 20.5v-11l7.5-5.5 7.5 5.5v11"/><path d="M9.5 20.5v-6h5v6"/>'),
  arrow: svg('<path d="M8 16 16 8"/><path d="M9.5 8H16v6.5"/>'),
};
