import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubdomain, getSubdomainConfig, isRouteAllowedForSubdomain } from '@/utils/subdomain';

export const SubdomainRouter = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const subdomain = getSubdomain();
  const config = getSubdomainConfig(subdomain);

  useEffect(() => {
    // Only redirect root path to default route
    if (config && location.pathname === '/') {
      navigate(config.defaultRoute, { replace: true });
    }
  }, [location.pathname, config, navigate]);

  // Set document title based on subdomain
  useEffect(() => {
    if (config) {
      document.title = `${config.name} - EmailScale`;
    } else {
      document.title = 'EmailScale - Email Management Platform';
    }
  }, [config]);

  return <>{children}</>;
};