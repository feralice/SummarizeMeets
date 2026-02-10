import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/meeting/pages/meeting-page.component').then((m) => m.MeetingPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
