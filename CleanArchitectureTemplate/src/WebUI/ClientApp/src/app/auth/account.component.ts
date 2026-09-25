import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

/** Login and registration, selected by the route's `mode` data. */
@Component({
  selector: 'app-account',
  imports: [FormsModule, RouterLink],
  templateUrl: './account.component.html'
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = input<'login' | 'register'>('login');
  // Bound from the query string; the router sets it to undefined when absent,
  // so the default lives in `destination` rather than on the input.
  readonly returnUrl = input<string | undefined>();
  readonly destination = computed(() => this.returnUrl() || '/todo');

  readonly isRegister = computed(() => this.mode() === 'register');

  email = '';
  password = '';
  readonly busy = signal(false);
  readonly errors = signal<string[]>([]);

  async submit(): Promise<void> {
    this.busy.set(true);
    this.errors.set([]);

    try {
      if (this.isRegister()) {
        await this.auth.register(this.email, this.password);
      } else {
        await this.auth.login(this.email, this.password);
      }
      await this.router.navigateByUrl(this.destination());
    } catch (error) {
      this.errors.set(this.describe(error));
    } finally {
      this.busy.set(false);
    }
  }

  private describe(error: unknown): string[] {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return ['Incorrect email or password.'];
      }
      // Identity returns validation problems keyed by error code.
      const problems = error.error?.errors as Record<string, string[]> | undefined;
      if (problems) {
        return Object.values(problems).flat();
      }
    }
    return ['Something went wrong. Please try again.'];
  }
}
