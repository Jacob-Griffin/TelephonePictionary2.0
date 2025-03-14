import { createContext } from '@lit/context';
import type { BYFOFirebaseAdapter, BYFOStore, RouteResult } from 'byfo-utils';

export const firebaseContext = createContext<BYFOFirebaseAdapter>('firebase');
export const storeContext = createContext<BYFOStore>('store');
export const routeContext = createContext<RouteResult>('route');
