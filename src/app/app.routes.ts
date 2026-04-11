import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'onboarding', loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
  { path: 'candidate/dashboard', loadComponent: () => import('./pages/candidate-dashboard/candidate-dashboard.component').then(m => m.CandidateDashboardComponent) },
  { path: 'recruiter/dashboard', loadComponent: () => import('./pages/recruiter-dashboard/recruiter-dashboard.component').then(m => m.RecruiterDashboardComponent) },
  { path: '**', redirectTo: '' }
];