import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const authenticated = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { ensureLoaded: () => Promise.resolve(), isAuthenticated: authenticated }
        }
      ]
    });
  });

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/todo' } as RouterStateSnapshot)
    ) as Promise<boolean | UrlTree>;

  it('allows a signed-in user', async () => {
    authenticated.set(true);

    expect(await run()).toBe(true);
  });

  it('sends an anonymous user to login with a return URL', async () => {
    authenticated.set(false);

    const result = await run();

    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Ftodo');
  });
});
