import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { unauthorizedInterceptor } from './auth/unauthorized.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // The API is same-origin and login sets an auth cookie, so requests
    // need no token handling; an expired session is caught on its first 401.
    provideHttpClient(withInterceptors([unauthorizedInterceptor]))
  ]
};
