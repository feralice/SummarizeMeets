import { Routes } from '@angular/router';
import { AppComponent } from './app';
import { LoginComponent } from './components/login/login.component';
import { authGuard, noAuthGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard],
  },
  {
    path: '',
    component: AppComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
