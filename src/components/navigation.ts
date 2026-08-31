/**
 * src/components/navigation.ts
 *
 * The five real routes, in nav order. Site structure, not a client fact, so it
 * lives here rather than in src/data/business.ts. `sitemap.xml` is generated
 * from the file system, so this list and the sitemap cannot disagree about
 * which pages exist — but keep them in step when a route is added.
 */

// import.meta.env.BASE_URL resolves to '/J.Michael-Bicycle-Repair/' (or '/' locally/custom domain)
const base = import.meta.env.BASE_URL.replace(/\/+$/, "");

const resolveHref = (path: string): string => {
  if (path === "/") return `${base}/` || "/";
  return `${base}${path}`;
};

export interface NavItem {
  readonly href: string;
  readonly label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: resolveHref("/"), label: "Home" },
  { href: resolveHref("/services/"), label: "Services" },
  { href: resolveHref("/pricing/"), label: "Pricing" },
  { href: resolveHref("/about/"), label: "About" },
  { href: resolveHref("/contact/"), label: "Contact" },
];

/**
 * True when `pathname` is the route `href` points at. Tolerates a missing or
 * duplicated trailing slash so `aria-current` is never silently wrong.
 */
export function isCurrentRoute(href: string, pathname: string): boolean {
  const normalise = (value: string): string =>
    value.length > 1 ? value.replace(/\/+$/, "") : value;
  return normalise(href) === normalise(pathname);
}
