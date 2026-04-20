import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserData } from '../../../core/services/auth.service';
import {
  RecruiterService,
  JobOffer,
  Application,
  RecruiterStats,
} from '../../../core/services/recruiter.service';
import { Subscription } from 'rxjs';

type Section =
  | 'dashboard'
  | 'offres'
  | 'candidatures'
  | 'candidats'
  | 'nouvelle-offre'
  | 'modifier-offre'
  | 'detail-candidature';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruiter-dashboard.component.html',
  styleUrls: ['./recruiter-dashboard.component.css'],
})
export class RecruiterDashboardComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;
  activeSection: Section = 'dashboard';
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

  // Job offers
  jobOffers: JobOffer[] = [];
  offersLoading = false;
  offersFilter: 'all' | 'active' | 'paused' | 'closed' | 'draft' = 'all';

  // Applications
  applications: Application[] = [];
  appsLoading = false;
  appsFilter: string = 'all';
  selectedOffer: JobOffer | null = null;
  selectedApplication: Application | null = null;

  // Candidates search
  candidates: any[] = [];
  candidatesLoading = false;
  candidateFilters = {
    keyword: '',
    sector: '',
    city: '',
    experienceYears: '',
    educationLevel: '',
  };

  // Form (create/edit offer)
  editingOffer: Partial<JobOffer> | null = null;
  formLoading = false;
  formSuccess = false;
  formError = '';
  newSkill = '';
  newResp = '';
  newReq = '';
  newNice = '';
  newBenefit = '';

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

  /* ── NAVIGATION ── */
  async navigate(section: Section) {
    this.activeSection = section;
    this.sidebarOpen = false;
    this.formError = '';
    this.formSuccess = false;

    if (section === 'offres') await this.loadOffers();
    if (section === 'candidatures') await this.loadAllApplications();
    if (section === 'candidats') await this.searchCandidates();
    if (section === 'nouvelle-offre') this.initNewOffer();
    if (section === 'dashboard') await this.loadDashboard();
  }

  /* ── DASHBOARD ── */
  async loadDashboard() {
    await this.recruiterService.refreshStats();
    this.offersLoading = true;
    this.jobOffers = await this.recruiterService.getMyJobOffers();
    this.offersLoading = false;
  }

  /* ── OFFERS ── */
  async loadOffers() {
    this.offersLoading = true;
    this.jobOffers = await this.recruiterService.getMyJobOffers();
    this.offersLoading = false;
  }

  get filteredOffers(): JobOffer[] {
    if (this.offersFilter === 'all') return this.jobOffers;
    return this.jobOffers.filter((o) => o.status === this.offersFilter);
  }

  async toggleOfferStatus(offer: JobOffer) {
    const newStatus = offer.status === 'active' ? 'paused' : 'active';
    await this.recruiterService.updateJobOffer(offer.id!, {
      status: newStatus,
    });
    await this.loadOffers();
  }

  async deleteOffer(offerId: string) {
    if (!confirm('Supprimer cette offre définitivement ?')) return;
    await this.recruiterService.deleteJobOffer(offerId);
    await this.loadOffers();
    await this.recruiterService.refreshStats();
  }

  async openOfferApplications(offer: JobOffer) {
    this.selectedOffer = offer;
    this.activeSection = 'candidatures';
    this.appsLoading = true;
    this.applications = await this.recruiterService.getApplicationsForOffer(
      offer.id!,
    );
    this.appsLoading = false;
  }

  editOffer(offer: JobOffer) {
    this.editingOffer = { ...offer };
    this.activeSection = 'modifier-offre';
  }

  /* ── APPLICATIONS ── */
  async loadAllApplications() {
    this.appsLoading = true;
    this.selectedOffer = null;
    this.applications = await this.recruiterService.getAllMyApplications();
    this.appsLoading = false;
  }

  get filteredApplications(): Application[] {
    if (this.appsFilter === 'all') return this.applications;
    return this.applications.filter((a) => a.status === this.appsFilter);
  }

  async updateStatus(app: Application, status: any) {
    await this.recruiterService.updateApplicationStatus(app.id!, status);
    app.status = status;
    if (this.selectedApplication && this.selectedApplication.id === app.id) {
      this.selectedApplication.status = status;
    }
  }

  async rateApp(app: Application, rating: number) {
    await this.recruiterService.rateApplication(app.id!, rating);
    app.rating = rating;
    if (this.selectedApplication && this.selectedApplication.id === app.id)
      this.selectedApplication.rating = rating;
  }

  openApplication(app: Application) {
    this.selectedApplication = app;
    this.activeSection = 'detail-candidature';
    if (app.status === 'new') {
      this.updateStatus(app, 'viewed');
    }
  }
  countByStatus(status: string): number {
    if (status === 'all') return this.applications.length;
    return this.applications.filter((a) => a.status === status).length;
  }
  getAppStatusConf(status: any) {
    return (
      this.recruiterService.appStatusConfig[
        status as keyof typeof this.recruiterService.appStatusConfig
      ] || { label: status, color: '#999', bg: 'rgba(153,153,153,.1)' }
    );
  }

  appStatusKeys = Object.keys(this.recruiterService.appStatusConfig);

  /* ── CANDIDATES ── */
  async searchCandidates() {
    this.candidatesLoading = true;
    this.candidates = await this.recruiterService.searchCandidates(
      this.candidateFilters,
    );
    this.candidatesLoading = false;
  }

  clearCandidateFilters() {
    this.candidateFilters = {
      keyword: '',
      sector: '',
      city: '',
      experienceYears: '',
      educationLevel: '',
    };
    this.searchCandidates();
  }

  viewCandidateCV(uid: string) {
    window.open(`/cv/${uid}`, '_blank');
  }

  /* ── FORM (Create / Edit Offer) ── */
  initNewOffer() {
    this.editingOffer = {
      title: '',
      sector: '',
      type: 'CDI',
      location: 'Dakar, Sénégal',
      remote: 'onsite',
      description: '',
      experienceLevel: 'Junior (0-2 ans)',
      educationLevel: 'Bac+3 (Licence)',
      responsibilities: [],
      requirements: [],
      niceToHave: [],
      benefits: [],
      skills: [],
      urgent: false,
      salaryCurrency: 'XOF',
      status: 'active',
      companyName: this.userData?.companyName || '',
    };
  }

  addItem(
    field:
      | 'skills'
      | 'responsibilities'
      | 'requirements'
      | 'niceToHave'
      | 'benefits',
    value: string,
  ) {
    if (!value.trim() || !this.editingOffer) return;
    const arr = (this.editingOffer[field] as string[]) || [];
    if (!arr.includes(value.trim())) arr.push(value.trim());
    this.editingOffer[field] = arr;
    // reset
    if (field === 'skills') this.newSkill = '';
    if (field === 'responsibilities') this.newResp = '';
    if (field === 'requirements') this.newReq = '';
    if (field === 'niceToHave') this.newNice = '';
    if (field === 'benefits') this.newBenefit = '';
  }

  removeItem(
    field:
      | 'skills'
      | 'responsibilities'
      | 'requirements'
      | 'niceToHave'
      | 'benefits',
    idx: number,
  ) {
    if (!this.editingOffer) return;
    const arr = (this.editingOffer[field] as string[]) || [];
    arr.splice(idx, 1);
    this.editingOffer[field] = [...arr];
  }

  onTagKeydown(event: KeyboardEvent, field: any, val: string) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addItem(field, val);
    }
  }

  async saveOffer() {
    if (!this.editingOffer) return;
    this.formLoading = true;
    this.formError = '';
    this.formSuccess = false;

    try {
      if (!this.editingOffer.title?.trim())
        throw new Error('Le titre est requis');
      if (!this.editingOffer.description?.trim())
        throw new Error('La description est requise');
      if (!this.editingOffer.sector) throw new Error('Le secteur est requis');

      if (this.editingOffer.id) {
        await this.recruiterService.updateJobOffer(
          this.editingOffer.id,
          this.editingOffer,
        );
      } else {
        await this.recruiterService.createJobOffer(this.editingOffer);
      }

      this.formSuccess = true;
      setTimeout(() => this.navigate('offres'), 1500);
    } catch (e: any) {
      this.formError = e.message || 'Une erreur est survenue';
    } finally {
      this.formLoading = false;
    }
  }

  /* ── HELPERS ── */
  get sectors() {
    return this.recruiterService.sectors;
  }
  get jobTypes() {
    return this.recruiterService.jobTypes;
  }
  get experienceLevels() {
    return this.recruiterService.experienceLevels;
  }
  get educationLevels() {
    return this.recruiterService.educationLevels;
  }
  get remoteOptions() {
    return this.recruiterService.remoteOptions;
  }

  formatDate(ts: any): string {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  formatSalary(min?: number, max?: number, currency = 'XOF'): string {
    if (!min && !max) return 'Non précisé';
    const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
    if (min && max) return `${fmt(min)} – ${fmt(max)} ${currency}`;
    if (min) return `À partir de ${fmt(min)} ${currency}`;
    return `Jusqu\'à ${fmt(max!)} ${currency}`;
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

  stars(rating: number | undefined): number[] {
    return [1, 2, 3, 4, 5];
  }

  async logout() {
    await this.authService.logout();
  }
}
