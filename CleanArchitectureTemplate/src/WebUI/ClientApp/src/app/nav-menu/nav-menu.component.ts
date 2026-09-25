import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-nav-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-menu.component.html'
})
export class NavMenuComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly expanded = signal(false);

  constructor() {
    this.auth.ensureLoaded();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}
