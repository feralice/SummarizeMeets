import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/meeting/pages/meeting-page.component').then((m) => m.MeetingPageComponent),
  },
];
