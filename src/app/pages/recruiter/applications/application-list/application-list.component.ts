import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  RecruiterService,
  Application,
  JobOffer,
  ApplicationStatus,
} from '../../../../core/services/recruiter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css'],
})
export class ApplicationListComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  filteredApplications: Application[] = [];
  jobOffers: JobOffer[] = [];
  isLoading = true;

  // Filters
  filterStatus: string = 'all';
  filterOfferId: string = '';
  searchTerm: string = '';
  dateRange: 'all' | 'today' | 'week' | 'month' = 'all';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Selected offer for filter
  selectedOffer: JobOffer | null = null;

  private subs = new Subscription();

  constructor(
    private recruiterService: RecruiterService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    // Check for offerId in query params
    this.subs.add(
      this.route.queryParams.subscribe((params) => {
        if (params['offerId']) {
          this.filterOfferId = params['offerId'];
        }
      }),
    );

    await this.loadData();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async loadData() {
    this.isLoading = true;
    try {
      // Load applications and offers in parallel
      const [applications, offers] = await Promise.all([
        this.recruiterService.getAllMyApplications(),
        this.recruiterService.getMyJobOffers(),
      ]);

      this.applications = applications;
      this.jobOffers = offers;

      // If filterOfferId is set, find the offer
      if (this.filterOfferId) {
        this.selectedOffer =
          this.jobOffers.find((o) => o.id === this.filterOfferId) || null;
      }

      this.applyFilters();
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      this.isLoading = false;
    }
  }
  get statusList(): string[] {
    return ['all', ...this.appStatusKeys];
  }
  get pages(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}
  applyFilters() {
    let filtered = [...this.applications];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((a) => a.status === this.filterStatus);
    }

    // Filter by offer
    if (this.filterOfferId) {
      filtered = filtered.filter((a) => a.jobId === this.filterOfferId);
    }

    // Filter by search term (candidate name or job title)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.candidateName?.toLowerCase().includes(term) ||
          a.jobTitle?.toLowerCase().includes(term) ||
          a.candidateTitle?.toLowerCase().includes(term),
      );
    }

    // Filter by date range
    if (this.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((a) => {
        const appliedDate = a.appliedAt?.toDate
          ? a.appliedAt.toDate()
          : new Date(a.appliedAt);

        if (this.dateRange === 'today') {
          return appliedDate >= today;
        } else if (this.dateRange === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return appliedDate >= weekAgo;
        } else if (this.dateRange === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return appliedDate >= monthAgo;
        }
        return true;
      });
    }

    // Sort by most recent first
    filtered.sort((a, b) => {
      const dateA = a.appliedAt?.toDate
        ? a.appliedAt.toDate()
        : new Date(a.appliedAt);
      const dateB = b.appliedAt?.toDate
        ? b.appliedAt.toDate()
        : new Date(b.appliedAt);
      return dateB.getTime() - dateA.getTime();
    });

    this.filteredApplications = filtered;
    this.totalPages = Math.ceil(
      this.filteredApplications.length / this.itemsPerPage,
    );
    this.currentPage = 1;
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onDateRangeChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filterStatus = 'all';
    this.filterOfferId = '';
    this.searchTerm = '';
    this.dateRange = 'all';
    this.selectedOffer = null;
    this.applyFilters();
  }

  selectOffer(offerId: string) {
    this.filterOfferId = offerId;
    this.selectedOffer = this.jobOffers.find((o) => o.id === offerId) || null;
    this.applyFilters();
  }

  get paginatedApplications(): Application[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredApplications.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStatusCount(status: string): number {
    if (status === 'all') return this.applications.length;
    return this.applications.filter((a) => a.status === status).length;
  }

  getStatusLabel(status: string): string {
    const config =
      this.recruiterService.appStatusConfig[status as ApplicationStatus];
    return config?.label || status;
  }

  getStatusColor(status: string): string {
    const config =
      this.recruiterService.appStatusConfig[status as ApplicationStatus];
    return config?.color || '#5A5A72';
  }

  getStatusBg(status: string): string {
    const config =
      this.recruiterService.appStatusConfig[status as ApplicationStatus];
    return config?.bg || 'rgba(90, 90, 114, 0.1)';
  }

  async updateStatus(application: Application, newStatus: string) {
    await this.recruiterService.updateApplicationStatus(
      application.id!,
      newStatus as ApplicationStatus,
    );
    application.status = newStatus as ApplicationStatus;
    this.applyFilters();
    await this.recruiterService.refreshStats();
  }

  viewApplication(applicationId: string) {
    this.router.navigate(['/recruiter/applications', applicationId]);
  }

  viewCandidateCV(candidateId: string) {
    window.open(`/cv/${candidateId}`, '_blank');
  }

  formatDate(ts: any): string {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRelativeDate(ts: any): string {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return this.formatDate(ts);
  }

  stars(rating: number | undefined): number[] {
    return [1, 2, 3, 4, 5];
  }

  get appStatusKeys(): ApplicationStatus[] {
    return Object.keys(
      this.recruiterService.appStatusConfig,
    ) as ApplicationStatus[];
  }
}
