import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule],
  templateUrl: './recruiter-dashboard.component.html',
  styleUrls: ['./recruiter-dashboard.component.css'],
})
export class RecruiterDashboardComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;

  stats: RecruiterStats = {
    totalOffers: 0,
    activeOffers: 0,
    newOffers: 0,
    totalApplications: 0,
    newApplications: 0,
    shortlisted: 0,
    interviews: 0,
  };

  recentOffers: JobOffer[] = [];
  recentApplications: Application[] = [];
  offersLoading = false;
  appsLoading = false;

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    public recruiterService: RecruiterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.userData$.subscribe((data) => {
        this.userData = data;
        this.isLoading = false;
        if (data?.role === 'recruiter') {
          this.loadDashboard();
        }
      })
    );

    this.subscriptions.add(
      this.recruiterService.stats$.subscribe((stats) => {
        this.stats = stats;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get fullName(): string {
    const firstName = this.userData?.firstName || '';
    const lastName = this.userData?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Recruteur';
  }

  get companyName(): string {
    return this.userData?.companyName || '';
  }

  getInitials(): string {
    const firstName = this.userData?.firstName || '';
    const lastName = this.userData?.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'R';
  }

  async loadDashboard(): Promise<void> {
    await this.recruiterService.refreshStats();

    this.offersLoading = true;
    const allOffers = await this.recruiterService.getMyJobOffers();
    this.recentOffers = allOffers.slice(0, 4);
    this.offersLoading = false;

    this.appsLoading = true;
    const allApps = await this.recruiterService.getAllMyApplications();
    this.recentApplications = allApps.slice(0, 4);
    this.appsLoading = false;
  }

  createOffer(): void {
    this.router.navigate(['/recruiter/offers/create']);
  }

  viewOffer(offerId: string): void {
    this.router.navigate(['/recruiter/offers', offerId]);
  }

  viewApplication(applicationId: string): void {
    this.router.navigate(['/recruiter/applications', applicationId]);
  }

  viewAllOffers(): void {
    this.router.navigate(['/recruiter/offers']);
  }

  viewAllApplications(): void {
    this.router.navigate(['/recruiter/applications']);
  }

  formatRelativeDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getStatusConfig(status: string): { label: string; badgeClass: string } {
    const configs: Record<string, { label: string; badgeClass: string }> = {
      active: { label: 'Active', badgeClass: 'badge-success' },
      paused: { label: 'Suspendue', badgeClass: 'badge-warning' },
      draft: { label: 'Brouillon', badgeClass: 'badge-neutral' },
      closed: { label: 'Fermée', badgeClass: 'badge-error' },
      new: { label: 'Nouvelle', badgeClass: 'badge-info' },
      viewed: { label: 'Consultée', badgeClass: 'badge-neutral' },
      shortlisted: { label: 'Sélectionné', badgeClass: 'badge-success' },
      interview: { label: 'Entretien', badgeClass: 'badge-warning' },
      offer: { label: 'Offre', badgeClass: 'badge-success' },
      rejected: { label: 'Non retenu', badgeClass: 'badge-error' },
    };
    return configs[status] || { label: status, badgeClass: 'badge-neutral' };
  }

  getJobTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CDI: 'CDI',
      CDD: 'CDD',
      Stage: 'Stage',
      Freelance: 'Freelance',
      Alternance: 'Alternance',
      'Temps partiel': 'Temps partiel',
    };
    return labels[type] || type;
  }
}
