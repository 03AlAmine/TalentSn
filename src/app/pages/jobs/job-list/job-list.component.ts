import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Firestore, collection, query, where, orderBy, getDocs } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { RecruiterService, JobOffer } from '../../../core/services/recruiter.service';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css']
})
export class JobListComponent implements OnInit {
  private firestore = inject(Firestore);
  private recruiterService = inject(RecruiterService);

  offers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  isLoading = true;

  filters = {
    keyword: '',
    sector: '',
    type: '',
    remote: '',
    location: ''
  };

  get sectors() { return this.recruiterService.sectors; }
  get jobTypes() { return this.recruiterService.jobTypes; }

  ngOnInit() {
    this.loadOffers();
  }

  async loadOffers() {
    const q = query(
      collection(this.firestore, 'jobOffers'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    this.offers = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobOffer));
    this.applyFilters();
    this.isLoading = false;
  }

  applyFilters() {
    let res = [...this.offers];
    const kw = this.filters.keyword.toLowerCase();
    if (kw) {
      res = res.filter(o =>
        o.title.toLowerCase().includes(kw) ||
        o.companyName?.toLowerCase().includes(kw) ||
        o.description?.toLowerCase().includes(kw) ||
        o.skills?.some(s => s.toLowerCase().includes(kw))
      );
    }
    if (this.filters.sector) res = res.filter(o => o.sector === this.filters.sector);
    if (this.filters.type) res = res.filter(o => o.type === this.filters.type);
    if (this.filters.remote) res = res.filter(o => o.remote === this.filters.remote);
    if (this.filters.location) {
      const loc = this.filters.location.toLowerCase();
      res = res.filter(o => o.location?.toLowerCase().includes(loc));
    }
    this.filteredOffers = res;
  }

  reset() {
    this.filters = { keyword:'', sector:'', type:'', remote:'', location:'' };
    this.applyFilters();
  }

  formatDate(ts: any): string {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    if (diff < 7) return `Il y a ${diff} jours`;
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  }

  formatSalary(o: JobOffer) {
    return this.recruiterService.formatSalary(o.salaryMin, o.salaryMax, o.salaryCurrency);
  }

  getRemoteLabel(r: string) {
    return { onsite:'Présentiel', hybrid:'Hybride', 'full-remote':'Remote' }[r] || r;
  }

  getTypeColor(t: string): string {
    const map: Record<string,string> = {
      CDI:'#6C63FF', CDD:'#3b82f6', Stage:'#f59e0b',
      Freelance:'#8b5cf6', Alternance:'#ec4899', 'Temps partiel':'#6b7280'
    };
    return map[t] || '#6C63FF';
  }
}
