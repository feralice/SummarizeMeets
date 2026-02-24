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
    path: 'history',
    loadComponent: () =>
      import('./features/history/pages/history-page.component').then((m) => m.HistoryPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/meeting/pages/meeting-history/meeting-history.component').then((m) => m.MeetingHistoryComponent),
  },
  {
    path: 'meeting/:id',
    loadComponent: () =>
      import('./features/meeting/pages/meeting-details/meeting-details.component').then((m) => m.MeetingDetailsComponent),
  },
];
