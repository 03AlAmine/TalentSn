// offers.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface JobOffer {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  type: 'CDI' | 'CDD' | 'Stage' | 'Freelance' | 'Alternance' | 'Temps partiel';
  remote: 'onsite' | 'hybrid' | 'full-remote';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  description: string;
  skills: string[];
  postedAt: Date;
  urgent: boolean;
  matchScore?: number;
}

interface FilterOptions {
  keyword: string;
  contractType: string;
  location: string;
  experience: string;
  remote: string;
}

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.css'],
})
export class OffersComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;
  offers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  favoriteIds: Set<string> = new Set();

  // Filtres
  filters: FilterOptions = {
    keyword: '',
    contractType: '',
    location: '',
    experience: '',
    remote: '',
  };

  showFilters = false;
  selectedOffer: JobOffer | null = null;
  showApplyModal = false;
  isApplying = false;
  applyMessage = '';

  // Options pour les filtres
  contractTypes = [
    'CDI',
    'CDD',
    'Stage',
    'Freelance',
    'Alternance',
    'Temps partiel',
  ];
  locations = [
    'Dakar',
    'Thiès',
    'Saint-Louis',
    'Ziguinchor',
    'Kaolack',
    'Touba',
    'Remote',
  ];
  experienceLevels = [
    'Débutant (0-2 ans)',
    'Confirmé (3-5 ans)',
    'Senior (5-10 ans)',
    'Expert (10+ ans)',
  ];
  remoteOptions = [
    { value: 'onsite', label: 'Présentiel' },
    { value: 'hybrid', label: 'Hybride' },
    { value: 'full-remote', label: 'Full Remote' },
  ];

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.authService.userData$.subscribe((data) => {
        this.userData = data;
        this.loadOffers();
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadOffers() {
    this.isLoading = true;
    // Simuler le chargement des offres
    setTimeout(() => {
      this.offers = this.generateMockOffers();
      this.filteredOffers = [...this.offers];
      this.isLoading = false;
    }, 800);
  }

  generateMockOffers(): JobOffer[] {
    return [
      {
        id: '1',
        title: 'Développeur Full Stack Senior',
        companyName: 'Wave Sénégal',
        location: 'Dakar',
        type: 'CDI',
        remote: 'hybrid',
        salaryMin: 500000,
        salaryMax: 800000,
        salaryCurrency: 'XOF',
        description:
          'Nous recherchons un développeur Full Stack expérimenté pour rejoindre notre équipe...',
        skills: ['Angular', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        urgent: true,
        matchScore: 92,
      },
      {
        id: '2',
        title: 'Data Scientist',
        companyName: 'Orange Sénégal',
        location: 'Dakar',
        type: 'CDI',
        remote: 'full-remote',
        salaryMin: 600000,
        salaryMax: 900000,
        salaryCurrency: 'XOF',
        description:
          "Rejoignez l'équipe Data d'Orange pour analyser et modéliser des données...",
        skills: ['Python', 'TensorFlow', 'SQL', 'Machine Learning', 'Pandas'],
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        urgent: false,
        matchScore: 78,
      },
      {
        id: '3',
        title: 'Chef de Projet Digital',
        companyName: 'Sonatel Academy',
        location: 'Dakar',
        type: 'CDI',
        remote: 'onsite',
        salaryMin: 400000,
        salaryMax: 600000,
        salaryCurrency: 'XOF',
        description:
          'Gestion de projets digitaux et accompagnement des équipes techniques...',
        skills: ['Agile', 'Scrum', "Gestion d'équipe", 'Jira', 'Communication'],
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        urgent: true,
        matchScore: 85,
      },
      {
        id: '4',
        title: 'DevOps Engineer',
        companyName: 'Free Sénégal',
        location: 'Dakar',
        type: 'CDI',
        remote: 'hybrid',
        salaryMin: 550000,
        salaryMax: 750000,
        salaryCurrency: 'XOF',
        description:
          "Mise en place et maintenance de l'infrastructure CI/CD...",
        skills: ['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Linux'],
        postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        urgent: false,
        matchScore: 70,
      },
      {
        id: '5',
        title: 'UI/UX Designer',
        companyName: 'JokkoLabs',
        location: 'Dakar',
        type: 'CDD',
        remote: 'hybrid',
        salaryMin: 350000,
        salaryMax: 500000,
        salaryCurrency: 'XOF',
        description:
          "Création d'interfaces utilisateur et amélioration de l'expérience utilisateur...",
        skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototypage', 'User Research'],
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        urgent: false,
        matchScore: 88,
      },
      {
        id: '6',
        title: 'Développeur Mobile Flutter',
        companyName: 'Cauri Money',
        location: 'Dakar',
        type: 'CDI',
        remote: 'full-remote',
        salaryMin: 450000,
        salaryMax: 650000,
        salaryCurrency: 'XOF',
        description:
          "Développement d'applications mobiles cross-platform avec Flutter...",
        skills: ['Flutter', 'Dart', 'Firebase', 'REST API', 'Git'],
        postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        urgent: true,
        matchScore: 95,
      },
    ];
  }

  applyFilters() {
    this.filteredOffers = this.offers.filter((offer) => {
      // Filtre keyword
      if (this.filters.keyword) {
        const keyword = this.filters.keyword.toLowerCase();
        const matchTitle = offer.title.toLowerCase().includes(keyword);
        const matchCompany = offer.companyName.toLowerCase().includes(keyword);
        const matchSkills = offer.skills.some((s) =>
          s.toLowerCase().includes(keyword),
        );
        if (!matchTitle && !matchCompany && !matchSkills) return false;
      }

      // Filtre type de contrat
      if (this.filters.contractType && offer.type !== this.filters.contractType)
        return false;

      // Filtre localisation
      if (
        this.filters.location &&
        !offer.location.includes(this.filters.location)
      )
        return false;

      // Filtre remote
      if (this.filters.remote && offer.remote !== this.filters.remote)
        return false;

      return true;
    });
  }

  resetFilters() {
    this.filters = {
      keyword: '',
      contractType: '',
      location: '',
      experience: '',
      remote: '',
    };
    this.filteredOffers = [...this.offers];
  }

  toggleFavorite(offerId: string, event: Event) {
    event.stopPropagation();
    if (this.favoriteIds.has(offerId)) {
      this.favoriteIds.delete(offerId);
    } else {
      this.favoriteIds.add(offerId);
    }
  }

  openOfferDetail(offer: JobOffer) {
    this.selectedOffer = offer;
    // Option: naviguer vers une page de détail
    // this.router.navigate(['/candidate/offers', offer.id]);
  }

  openApplyModal(offer: JobOffer, event: Event) {
    event.stopPropagation();
    this.selectedOffer = offer;
    this.showApplyModal = true;
    this.applyMessage = '';
  }

  async applyForJob() {
    if (!this.userData) {
      this.router.navigate(['/login']);
      return;
    }

    this.isApplying = true;

    // Simuler l'envoi de la candidature
    setTimeout(() => {
      this.isApplying = false;
      this.showApplyModal = false;
      this.applyMessage = 'Candidature envoyée avec succès !';
      setTimeout(() => (this.applyMessage = ''), 3000);
    }, 1500);
  }

  getRemoteLabel(remote: string): string {
    const option = this.remoteOptions.find((o) => o.value === remote);
    return option?.label || remote;
  }

  getMatchScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    return 'medium';
  }

  // offers.component.ts (CORRIGÉ)

  // 1. Correction de la méthode formatSalary
  formatSalary(salaryMin?: number, salaryMax?: number): string {
    if (!salaryMin && !salaryMax) return 'Non spécifié';
    const formatter = new Intl.NumberFormat('fr-FR');
    if (salaryMin && salaryMax) {
      return `${formatter.format(salaryMin)} - ${formatter.format(salaryMax)} FCFA`;
    }
    if (salaryMin) {
      return `À partir de ${formatter.format(salaryMin)} FCFA`;
    }
    if (salaryMax) {
      return `Jusqu'à ${formatter.format(salaryMax)} FCFA`;
    }
    return 'Non spécifié';
  }

  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  }

  getContractTypeColor(type: string): string {
    const colors: Record<string, string> = {
      CDI: '#00b894',
      CDD: '#f59e0b',
      Stage: '#3b82f6',
      Freelance: '#8b5cf6',
      Alternance: '#ec4899',
      'Temps partiel': '#6b7280',
    };
    return colors[type] || '#64748b';
  }
}
