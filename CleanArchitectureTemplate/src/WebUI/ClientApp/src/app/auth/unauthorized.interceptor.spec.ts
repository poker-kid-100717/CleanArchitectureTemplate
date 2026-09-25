import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('unauthorizedInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  const clearSession = vi.fn();

  beforeEach(() => {
    clearSession.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { clearSession } }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('clears the session and redirects to login on a 401 from the API', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get('/api/TodoLists').subscribe({ error: () => {} });
    httpTesting.expectOne('/api/TodoLists').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(clearSession).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('leaves the auth endpoints to handle their own 401s', () => {
    http.post('/api/Users/login', {}).subscribe({ error: () => {} });
    httpTesting.expectOne('/api/Users/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(clearSession).not.toHaveBeenCalled();
  });

  it('ignores other errors', () => {
    http.get('/api/TodoLists').subscribe({ error: () => {} });
    httpTesting.expectOne('/api/TodoLists').flush(null, { status: 500, statusText: 'Server Error' });

    expect(clearSession).not.toHaveBeenCalled();
  });
});
