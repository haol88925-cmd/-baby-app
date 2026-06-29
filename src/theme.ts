/**
 * Figma uses a 750 px-wide, 2x iOS canvas. All layout tokens below are
 * normalized to iOS points: Figma px / 2 = React Native dp/pt.
 */
export const colors = {
  background: '#F3F5F7',
  surface: '#FFFFFF',
  textPrimary: '#222229',
  textSecondary: '#8B8B94',
  actionPrimary: '#645AE5',
  feeding: '#FFCEF3',
  diaper: '#FBE8C4',
  sleep: '#C5DCFF',
  medicine: '#DCF04F',
  vaccine: '#D1E8F2',
  iconOverlay: 'rgba(255, 255, 255, 0.5)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 9,
  lg: 10,
  xl: 12,
  xxl: 20,
  page: 24,
} as const;

export const radius = {
  image: 8.5,
  card: 17,
  pill: 999,
} as const;

export const typography = {
  greeting: { fontSize: 25, lineHeight: 31.5, fontWeight: '700' as const },
  pageMeta: { fontSize: 13, lineHeight: 19.5, fontWeight: '400' as const },
  sectionTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600' as const },
  cardTitle: { fontSize: 17, lineHeight: 21.5, fontWeight: '600' as const },
  listTitle: { fontSize: 13, lineHeight: 19.5, fontWeight: '600' as const },
  meta: { fontSize: 11, lineHeight: 14.3, fontWeight: '400' as const },
  nav: { fontSize: 13, lineHeight: 13, fontWeight: '500' as const },
  navActive: { fontSize: 13, lineHeight: 13, fontWeight: '600' as const },
} as const;
