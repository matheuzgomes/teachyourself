export function withBase(path: string): string {
  if (!path || path.startsWith('#') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:')) {
    return path;
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${base}${cleanPath}`;
}
