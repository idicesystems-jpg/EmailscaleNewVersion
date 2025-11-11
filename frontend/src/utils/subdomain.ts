import { subdomainConfigs, SubdomainConfig } from '@/config/subdomains';

export const getSubdomain = (): string | null => {
  // For local development, check URL params first
  const urlParams = new URLSearchParams(window.location.search);
  const subdomainParam = urlParams.get('subdomain');
  if (subdomainParam) {
    return subdomainParam;
  }

  // Get hostname and extract subdomain
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // No subdomain in local dev
  }

  // Split hostname and get subdomain
  const parts = hostname.split('.');
  
  // For emailscale.io, we expect: subdomain.emailscale.io
  if (parts.length >= 3) {
    const subdomain = parts[0];
    return subdomain;
  }

  return null;
};

export const getSubdomainConfig = (subdomain: string | null): SubdomainConfig | null => {
  if (!subdomain) return null;
  return subdomainConfigs[subdomain] || null;
};

export const isRouteAllowedForSubdomain = (route: string, config: SubdomainConfig | null): boolean => {
  if (!config) return true; // No subdomain restriction

  // Check if route matches any allowed pattern
  return config.allowedRoutes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      return route.startsWith(base);
    }
    return route === pattern;
  });
};

export const getSubdomainUrl = (subdomain: string, path: string = '/'): string => {
  const isProduction = window.location.hostname.includes('emailscale.io');
  
  if (isProduction) {
    return `https://${subdomain}.emailscale.io${path}`;
  }
  
  // Local development - use query param
  return `${window.location.origin}${path}?subdomain=${subdomain}`;
};