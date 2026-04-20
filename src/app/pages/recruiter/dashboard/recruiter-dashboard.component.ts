import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserData } from '../../../core/services/auth.service';
import {
  RecruiterService,
  JobOffer,
  Application,
  RecruiterStats,
} from '../../../core/services/recruiter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recruiter-dashboard.component.html',
  styleUrls: ['./recruiter-dashboard.component.css'],
})
export class RecruiterDashboardComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;
  sidebarOpen = false;

  // Stats
  stats: RecruiterStats = {
    totalOffers: 0,
    activeOffers: 0,
    totalApplications: 0,
    newApplications: 0,
    shortlisted: 0,
    interviews: 0,
  };

  // Recent offers
  recentOffers: JobOffer[] = [];
  recentApplications: Application[] = [];
  offersLoading = false;
  appsLoading = false;

  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    public recruiterService: RecruiterService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subs.add(
      this.authService.userData$.subscribe((data) => {
        this.userData = data;
        this.isLoading = false;
        if (data?.role === 'recruiter') {
          this.loadDashboard();
        }
      }),
    );
    this.subs.add(
      this.recruiterService.stats$.subscribe((s) => (this.stats = s)),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /* ── GETTERS ── */
  get fullName() {
    return (
      `${this.userData?.firstName || ''} ${this.userData?.lastName || ''}`.trim() ||
      'Recruteur'
    );
  }
  get companyName() {
    return this.userData?.companyName || 'Mon entreprise';
  }
  get position() {
    return this.userData?.position || '';
  }
  get photoURL() {
    return this.userData?.photoURL || '';
  }
  get initials() {
    const f = this.userData?.firstName?.[0] || '';
    const l = this.userData?.lastName?.[0] || '';
    return (f + l).toUpperCase() || 'R';
  }

  /* ── DASHBOARD ── */
  async loadDashboard() {
    await this.recruiterService.refreshStats();

    this.offersLoading = true;
    const allOffers = await this.recruiterService.getMyJobOffers();
    this.recentOffers = allOffers.slice(0, 5);
    this.offersLoading = false;

    this.appsLoading = true;
    const allApps = await this.recruiterService.getAllMyApplications();
    this.recentApplications = allApps.slice(0, 5);
    this.appsLoading = false;
  }

  /* ── ACTIONS ── */
  viewOffer(offerId: string) {
    this.router.navigate(['/recruiter/offers/edit', offerId]);
  }

  viewApplication(applicationId: string) {
    this.router.navigate(['/recruiter/applications', applicationId]);
  }

  async logout() {
    await this.authService.logout();
  }

  /* ── HELPERS ── */
  formatDate(ts: any): string {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }

  getJobTypeColor(type: string): string {
    const map: Record<string, string> = {
      CDI: '#00D68F',
      CDD: '#3b82f6',
      Stage: '#f59e0b',
      Freelance: '#8b5cf6',
      Alternance: '#ec4899',
      'Temps partiel': '#6b7280',
    };
    return map[type] || '#00D68F';
  }

  getAppStatusConf(status: string) {
    return (
      this.recruiterService.appStatusConfig[
        status as keyof typeof this.recruiterService.appStatusConfig
      ] || { label: status, color: '#999', bg: 'rgba(153,153,153,.1)' }
    );
  }
}
