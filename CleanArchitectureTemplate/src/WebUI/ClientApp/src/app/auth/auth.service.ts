import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface InfoResponse {
  email: string;
}

/**
 * Talks to ASP.NET Core Identity's API endpoints (/api/Users). Login asks
 * for a cookie, so the browser attaches it to every API call automatically.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly email = signal<string | null>(null);
  private loaded?: Promise<void>;

  readonly userName = this.email.asReadonly();
  readonly isAuthenticated = computed(() => this.email() !== null);

  /** Resolves once the current session (if any) has been checked. */
  ensureLoaded(): Promise<void> {
    this.loaded ??= this.refresh();
    return this.loaded;
  }

  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(this.http.post('/api/Users/login', { email, password }, { params: { useCookies: true } }));
    await this.refresh();
  }

  async register(email: string, password: string): Promise<void> {
    await firstValueFrom(this.http.post('/api/Users/register', { email, password }));
    await this.login(email, password);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/Users/logout', {}));
    this.email.set(null);
  }

  private async refresh(): Promise<void> {
    try {
      const info = await firstValueFrom(this.http.get<InfoResponse>('/api/Users/manage/info'));
      this.email.set(info.email);
    } catch {
      this.email.set(null);
    }
  }
}
