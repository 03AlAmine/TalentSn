import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruiterService } from '../../../../core/services/recruiter.service';

interface Candidate {
  id: string;
  uid?: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  title?: string;
  city?: string;
  country?: string;
  sector?: string;
  experienceYears?: string;
  educationLevel?: string;
  cvData?: {
    summary?: string;
    technicalSkills?: string[];
    experiences?: any[];
    education?: any[];
    languages?: any[];
  };
  onboardingCompleted?: boolean;
}

@Component({
  selector: 'app-talent-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './talent-search.component.html',
  styleUrls: ['./talent-search.component.css'],
})
export class TalentSearchComponent implements OnInit {
  candidates: Candidate[] = [];
  filteredCandidates: Candidate[] = [];
  isLoading = true;

  filters = {
    keyword: '',
    sector: '',
    city: '',
    experienceYears: '',
    educationLevel: '',
    minRating: 0,
  };

  sortBy: 'relevance' | 'experience' | 'name' = 'relevance';
  sortOrder: 'asc' | 'desc' = 'desc';

  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  savedSearches: any[] = [];
  showSaveSearchModal = false;
  searchName = '';

  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private recruiterService: RecruiterService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.searchCandidates();
    this.loadSavedSearches();
  }

  async searchCandidates() {
    this.isLoading = true;
    try {
      const results = await this.recruiterService.searchCandidates(this.filters);
      this.candidates = results;
      this.applyFiltersAndSort();
    } catch (error) {
      console.error('Error searching candidates:', error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFiltersAndSort() {
    let filtered = [...this.candidates];

    if (this.filters.keyword) {
      const kw = this.filters.keyword.toLowerCase();
      filtered = filtered.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(kw) ||
        c.title?.toLowerCase().includes(kw) ||
        c.cvData?.technicalSkills?.some(s => s.toLowerCase().includes(kw)) ||
        c.cvData?.summary?.toLowerCase().includes(kw)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'experience':
          const expOrder: Record<string, number> = {
            'Junior (0-2 ans)': 1,
            'Confirmé (3-5 ans)': 2,
            'Senior (5-10 ans)': 3,
            'Expert (10+ ans)': 4,
          };
          const expA = expOrder[a.experienceYears as keyof typeof expOrder] || 0;
          const expB = expOrder[b.experienceYears as keyof typeof expOrder] || 0;
          comparison = expA - expB;
          break;
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        default:
          comparison = 0;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredCandidates = filtered;
    this.totalPages = Math.ceil(this.filteredCandidates.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  onFilterChange() {
    this.searchCandidates();
  }

  onKeywordSearch() {
    this.searchCandidates();
  }

  clearFilters() {
    this.filters = {
      keyword: '',
      sector: '',
      city: '',
      experienceYears: '',
      educationLevel: '',
      minRating: 0,
    };
    this.searchCandidates();
  }

  changeSort() {
    this.applyFiltersAndSort();
  }

  get paginatedCandidates(): Candidate[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCandidates.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  viewCandidateProfile(candidateId: string) {
    this.router.navigate(['/recruiter/talents', candidateId]);
  }

  async saveCurrentSearch() {
    if (!this.searchName.trim()) {
      return;
    }

    const searchToSave = {
      name: this.searchName,
      filters: { ...this.filters },
      createdAt: new Date(),
      resultsCount: this.filteredCandidates.length,
    };

    const saved = localStorage.getItem('recruiter_saved_searches');
    const searches = saved ? JSON.parse(saved) : [];
    searches.unshift(searchToSave);
    localStorage.setItem('recruiter_saved_searches', JSON.stringify(searches.slice(0, 10)));

    this.loadSavedSearches();
    this.showSaveSearchModal = false;
    this.searchName = '';
  }

  loadSavedSearches() {
    const saved = localStorage.getItem('recruiter_saved_searches');
    this.savedSearches = saved ? JSON.parse(saved) : [];
  }

  applySavedSearch(search: any) {
    this.filters = { ...search.filters };
    this.searchCandidates();
  }

  deleteSavedSearch(index: number) {
    this.savedSearches.splice(index, 1);
    localStorage.setItem('recruiter_saved_searches', JSON.stringify(this.savedSearches));
    this.loadSavedSearches();
  }

  getInitials(candidate: Candidate): string {
    return `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase();
  }

  getFullName(candidate: Candidate): string {
    return `${candidate.firstName} ${candidate.lastName}`.trim();
  }

  getTopSkills(candidate: Candidate, count: number = 4): string[] {
    return candidate.cvData?.technicalSkills?.slice(0, count) || [];
  }

  getExperienceLevel(experience: string): string {
    const levelMap: Record<string, string> = {
      'Junior (0-2 ans)': 'Junior',
      'Confirmé (3-5 ans)': 'Confirmé',
      'Senior (5-10 ans)': 'Senior',
      'Expert (10+ ans)': 'Expert',
    };
    return levelMap[experience] || experience;
  }

  get sectors(): string[] {
    return this.recruiterService.sectors;
  }

  get experienceLevels(): string[] {
    return this.recruiterService.experienceLevels;
  }

  get educationLevels(): string[] {
    return this.recruiterService.educationLevels;
  }
}
