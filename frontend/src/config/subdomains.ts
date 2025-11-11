export type SubdomainConfig = {
  subdomain: string;
  name: string;
  description: string;
  defaultRoute: string;
  allowedRoutes: string[];
};

export const subdomainConfigs: Record<string, SubdomainConfig> = {
  login: {
    subdomain: 'login',
    name: 'Login',
    description: 'Authentication and login',
    defaultRoute: '/auth',
    allowedRoutes: ['/auth', '/dashboard', '/dashboard/*'],
  },
  dashboard: {
    subdomain: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard and overview',
    defaultRoute: '/dashboard',
    allowedRoutes: ['/dashboard', '/dashboard/*', '/auth', '/email-verification'],
  },
  inbox: {
    subdomain: 'inbox',
    name: 'Inbox Ordering',
    description: 'Inbox ordering management',
    defaultRoute: '/dashboard/inbox-ordering',
    allowedRoutes: ['/dashboard/inbox-ordering', '/auth'],
  },
  warmup: {
    subdomain: 'warmup',
    name: 'Email Warmup',
    description: 'Email warmup management',
    defaultRoute: '/dashboard/warmup',
    allowedRoutes: ['/dashboard/warmup', '/auth'],
  },
  ghl: {
    subdomain: 'ghl',
    name: 'Integrations',
    description: 'Third-party integrations',
    defaultRoute: '/dashboard/integrations',
    allowedRoutes: ['/dashboard/integrations', '/auth'],
  },
  help: {
    subdomain: 'help',
    name: 'Support',
    description: 'Help and support center',
    defaultRoute: '/dashboard/support',
    allowedRoutes: ['/dashboard/support', '/auth'],
  },
  admin: {
    subdomain: 'admin',
    name: 'Admin Dashboard',
    description: 'Administrative dashboard',
    defaultRoute: '/admin',
    allowedRoutes: ['/admin', '/admin/*', '/auth'],
  },
};

export const getSubdomainConfig = (subdomain: string): SubdomainConfig | null => {
  return subdomainConfigs[subdomain] || null;
};