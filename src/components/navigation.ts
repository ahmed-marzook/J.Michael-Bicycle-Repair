/**
 * src/components/navigation.ts
 *
 * The five real routes, in nav order. Site structure, not a client fact, so it
 * lives here rather than in src/data/business.ts. `sitemap.xml` is generated
 * from the file system, so this list and the sitemap cannot disagree about
 * which pages exist — but keep them in step when a route is added.
 */
export interface NavItem {
  readonly href: string;
  readonly label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

/**
 * True when `pathname` is the route `href` points at. Tolerates a missing or
 * duplicated trailing slash so `aria-current` is never silently wrong.
 */
export function isCurrentRoute(href: string, pathname: string): boolean {
  const normalise = (value: string): string =>
    value.length > 1 ? value.replace(/\/+$/, '') : value;
  return normalise(href) === normalise(pathname);
}
