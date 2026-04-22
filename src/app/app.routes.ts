// app.routes.ts (CORRIGÉ)
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RecruiterLayoutComponent } from './pages/layouts/recruiter-layout/recruiter-layout.component';
import { CandidateLayoutComponent } from './pages/layouts/candidat-layout/candidate-layout.component';

export const routes: Routes = [
  // ─── PUBLIC ──────────────────────────────────────────────
  { path: '', component: HomeComponent },

  // ─── AUTH ────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // ─── ONBOARDING ──────────────────────────────────────────
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },

  // ─── OFFRES PUBLIQUES ───────────────────────────────────
  {
    path: 'offres',
    loadComponent: () => import('./pages/jobs/job-list/job-list.component').then(m => m.JobListComponent)
  },
  {
    path: 'offres/:id',
    loadComponent: () => import('./pages/jobs/job-detail/job-detail.component').then(m => m.JobDetailComponent)
  },

  // ─── CANDIDAT ────────────────────────────────────────────
  {
    path: 'candidate',
    component: CandidateLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/candidats/candidate-dashboard/candidate-dashboard.component').then(m => m.CandidateDashboardComponent)
      },
      {
        path: 'cv',
        loadComponent: () => import('./pages/candidats/cv/cv-view/cv-view.component').then(m => m.CvViewComponent)
      },
      {
        path: 'cv/upload',
        loadComponent: () => import('./pages/candidats/cv/cv-upload/cv-upload.component').then(m => m.CvUploadComponent)
      },
    {
        path: 'offers',
        loadComponent: () => import('./pages/candidats/offers/offers.component').then(m => m.OffersComponent)
      },
      {
        path: 'applications',
        loadComponent: () => import('./pages/candidats/applications/applications.component').then(m => m.ApplicationsComponent)
      },
      /*  {
        path: 'messages',
        loadComponent: () => import('./pages/candidats/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'interviews',
        loadComponent: () => import('./pages/candidats/interviews/interviews.component').then(m => m.InterviewsComponent)
      },*/
      {
        path: 'profile',
        loadComponent: () => import('./pages/candidats/profile/candidate-profile.component').then(m => m.CandidateProfileComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ─── RECRUTEUR ───────────────────────────────────────────
  {
    path: 'recruiter',
    component: RecruiterLayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/recruiter/dashboard/recruiter-dashboard.component').then(m => m.RecruiterDashboardComponent) },
      { path: 'offers', loadComponent: () => import('./pages/recruiter/offers/offer-list/offer-list.component').then(m => m.OfferListComponent) },
      { path: 'offers/create', loadComponent: () => import('./pages/recruiter/offers/offer-form/offer-form.component').then(m => m.OfferFormComponent) },
      { path: 'offers/edit/:id', loadComponent: () => import('./pages/recruiter/offers/offer-form/offer-form.component').then(m => m.OfferFormComponent) },
      { path: 'applications', loadComponent: () => import('./pages/recruiter/applications/application-list/application-list.component').then(m => m.ApplicationListComponent) },
      { path: 'applications/:id', loadComponent: () => import('./pages/recruiter/applications/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent) },
      { path: 'talents', loadComponent: () => import('./pages/recruiter/talents/talent-search/talent-search.component').then(m => m.TalentSearchComponent) },
      { path: 'talents/:id', loadComponent: () => import('./pages/recruiter/talents/talent-profile/talent-profile.component').then(m => m.TalentProfileComponent) },
      { path: 'company', loadComponent: () => import('./pages/recruiter/company/company-settings.component').then(m => m.CompanySettingsComponent) },
      { path: 'profile', loadComponent: () => import('./pages/recruiter/profile/profile.component').then(m => m.ProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ─── CV PUBLIC ───────────────────────────────────────────
  {
    path: 'cv/:uid',
    loadComponent: () => import('./pages/candidats/cv/cv-view/cv-view.component').then(m => m.CvViewComponent)
  },

  // ─── REDIRECTION ─────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
