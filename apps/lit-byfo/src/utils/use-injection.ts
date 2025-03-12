import { BYFOInjectionSources, inject } from 'byfo-utils';
import { ReactiveControllerHost, ReactiveController } from 'lit';

class InjectionController implements ReactiveController {
  host: ReactiveController & Node;
  targets: (keyof BYFOInjectionSources)[];
  constructor(host: ReactiveControllerHost & Node, targets: (keyof BYFOInjectionSources)[]) {
    host.addController(this);
    this.host = host;
    this.targets = targets;
    try {
      this.getRoute = this.maybeInject('getRoute');
      this.store = this.maybeInject('store');
      this.firebase = this.maybeInject('firebase');
    } catch {
      this.store ??= null;
      this.firebase ??= null;
      this.getRoute ??= null;
    }
  }

  maybeInject<T extends keyof BYFOInjectionSources>(target: T): BYFOInjectionSources[T] | null {
    if (this.targets.includes(target)) {
      return inject(this.host, target);
    }
    return null;
  }

  store: BYFOInjectionSources['store'] | null;
  firebase: BYFOInjectionSources['firebase'] | null;
  getRoute: BYFOInjectionSources['getRoute'] | null;

  hostConnected(): void {
    this.store ??= this.maybeInject('store');
    this.firebase ??= this.maybeInject('firebase');
    this.getRoute ??= this.maybeInject('getRoute');
  }
}

export function useInjection(host: ReactiveControllerHost & Node, targets: (keyof BYFOInjectionSources)[]): InjectionController {
  return new InjectionController(host, targets);
}
