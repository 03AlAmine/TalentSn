import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  RecruiterService,
  JobOffer,
} from '../../../../core/services/recruiter.service';

@Component({
  selector: 'app-offer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './offer-list.component.html',
  styleUrls: ['./offer-list.component.css'],
})
export class OfferListComponent implements OnInit {
  jobOffers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  isLoading = true;
  filterStatus: 'all' | 'active' | 'paused' | 'closed' | 'draft' = 'all';
  searchTerm = '';
  filters: Array<typeof this.filterStatus> = [
    'all',
    'active',
    'paused',
    'draft',
    'closed',
  ];
  constructor(
    private recruiterService: RecruiterService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.loadOffers();
  }

  async loadOffers() {
    this.isLoading = true;
    this.jobOffers = await this.recruiterService.getMyJobOffers();
    this.applyFilters();
    this.isLoading = false;
  }

  applyFilters() {
    let filtered = [...this.jobOffers];

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((o) => o.status === this.filterStatus);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(term) ||
          o.location?.toLowerCase().includes(term) ||
          o.sector?.toLowerCase().includes(term),
      );
    }

    this.filteredOffers = filtered;
  }

  onFilterChange(status: typeof this.filterStatus) {
    this.filterStatus = status;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filterStatus = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  async toggleOfferStatus(offer: JobOffer) {
    const newStatus = offer.status === 'active' ? 'paused' : 'active';
    await this.recruiterService.updateJobOffer(offer.id!, {
      status: newStatus,
    });
    await this.loadOffers();
    await this.recruiterService.refreshStats();
  }

  async deleteOffer(offerId: string) {
    if (!confirm('Supprimer cette offre définitivement ?')) return;
    await this.recruiterService.deleteJobOffer(offerId);
    await this.loadOffers();
    await this.recruiterService.refreshStats();
  }

  editOffer(offerId: string) {
    this.router.navigate(['/recruiter/offers/edit', offerId]);
  }

  duplicateOffer(offer: JobOffer) {
    const { id, createdAt, applicationCount, viewCount, ...copy } = offer;
    copy.title = `${copy.title} (Copie)`;
    copy.status = 'draft';
    this.recruiterService.createJobOffer(copy).then(() => this.loadOffers());
  }

  viewApplications(offerId: string) {
    this.router.navigate(['/recruiter/applications'], {
      queryParams: { offerId },
    });
  }

  getStatusCount(status: string): number {
    if (status === 'all') return this.jobOffers.length;
    return this.jobOffers.filter((o) => o.status === status).length;
  }

  formatDate(ts: any): string {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR');
  }

  formatSalary(min?: number, max?: number, currency = 'XOF'): string {
    if (!min && !max) return 'Non précisé';
    const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
    if (min && max) return `${fmt(min)} – ${fmt(max)} ${currency}`;
    if (min) return `À partir de ${fmt(min)} ${currency}`;
    return `Jusqu'à ${fmt(max!)} ${currency}`;
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
}
