import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'todo', canActivate: [authGuard], loadComponent: () => import('./todo/todo.component').then(m => m.TodoComponent) },
  { path: 'architecture', loadComponent: () => import('./architecture/architecture.component').then(m => m.ArchitectureComponent) },
  { path: 'login', loadComponent: () => import('./auth/account.component').then(m => m.AccountComponent), data: { mode: 'login' } },
  { path: 'register', loadComponent: () => import('./auth/account.component').then(m => m.AccountComponent), data: { mode: 'register' } },
  { path: '**', redirectTo: '' }
];
