import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild, CanDeactivate, CanMatch, GuardResult, MaybeAsync, Route, RouterStateSnapshot, UrlSegment } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivateChild, CanDeactivate<unknown>, CanMatch {
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): MaybeAsync<GuardResult> {
    return true;
  }
  canDeactivate(
    component: unknown,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): MaybeAsync<GuardResult> {
    return true;
  }
  canMatch(
    route: Route,
    segments: UrlSegment[]): MaybeAsync<GuardResult> {
    return true;
  }
}
