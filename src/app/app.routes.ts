import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'candidate/dashboard',
    loadComponent: () => import('./pages/candidats/candidate-dashboard/candidate-dashboard.component').then(m => m.CandidateDashboardComponent)
  },
  {
    path: 'candidate/cv',
    loadComponent: () => import('./pages/candidats/cv/cv-view/cv-view.component').then(m => m.CvViewComponent)
  },
  {
    path: 'cv/:uid',
    loadComponent: () => import('./pages/candidats/cv/cv-view/cv-view.component').then(m => m.CvViewComponent)
  },
  {
    path: 'recruiter/dashboard',
    loadComponent: () => import('./pages/recruiter/recruiter-dashboard/recruiter-dashboard.component').then(m => m.RecruiterDashboardComponent)
  },
  // ── Offres publiques (candidats peuvent postuler) ──
  {
    path: 'offres',
    loadComponent: () => import('./pages/jobs/job-list/job-list.component').then(m => m.JobListComponent)
  },
  {
    path: 'offres/:id',
    loadComponent: () => import('./pages/jobs/job-detail/job-detail.component').then(m => m.JobDetailComponent)
  },
  { path: '**', redirectTo: '' }
];
