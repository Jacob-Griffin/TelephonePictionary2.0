import { createContext } from '@lit/context';
import type { BYFOFirebaseAdapter, BYFOStore, RouteResult } from '@byfo/utils';
import type { ThemeId } from '@byfo/themes';

export const firebaseContext = createContext<BYFOFirebaseAdapter>('firebase');
export const storeContext = createContext<BYFOStore<ThemeId[]>>('store');
export const routeContext = createContext<RouteResult>('route');
