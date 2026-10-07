import { createContext, useContext, type ReactNode } from 'react';
import { services as defaultServices, type Services } from './index';

/**
 * Injects the service container. The application tree passes the registry once
 * (see main.tsx); tests pass an isolated container with an in-memory database.
 */
const ServicesContext = createContext<Services>(defaultServices);

export function ServicesProvider({ value, children }: { value?: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={value ?? defaultServices}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  return useContext(ServicesContext);
}
