// applications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  appliedDate: Date;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted';
  statusMessage?: string;
  nextStep?: string;
  interviewDate?: Date;
}

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css']
})
export class ApplicationsComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;
  applications: Application[] = [];
  filteredApplications: Application[] = [];
  selectedStatus = 'all';
  selectedApp: Application | null = null;
  showDetailModal = false;

  statusOptions = [
    { value: 'all', label: 'Toutes', icon: '📋' },
    { value: 'pending', label: 'En attente', icon: '⏳' },
    { value: 'reviewed', label: 'Consultées', icon: '👁️' },
    { value: 'interview', label: 'Entretien', icon: '🎯' },
    { value: 'accepted', label: 'Acceptées', icon: '✅' },
    { value: 'rejected', label: 'Refusées', icon: '❌' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.authService.userData$.subscribe(data => {
        this.userData = data;
        this.loadApplications();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadApplications() {
    this.isLoading = true;
    // Simuler le chargement des candidatures
    setTimeout(() => {
      this.applications = this.generateMockApplications();
      this.filterApplications();
      this.isLoading = false;
    }, 800);
  }

  generateMockApplications(): Application[] {
    return [
      {
        id: '1',
        jobTitle: 'Développeur Full Stack Senior',
        companyName: 'Wave Sénégal',
        location: 'Dakar',
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'pending',
        statusMessage: 'Votre candidature a bien été reçue'
      },
      {
        id: '2',
        jobTitle: 'Data Scientist',
        companyName: 'Orange Sénégal',
        location: 'Dakar',
        appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'reviewed',
        statusMessage: 'Votre profil a été consulté',
        nextStep: 'En cours d\'analyse par l\'équipe RH'
      },
      {
        id: '3',
        jobTitle: 'UI/UX Designer',
        companyName: 'JokkoLabs',
        location: 'Dakar',
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'interview',
        statusMessage: 'Félicitations ! Vous êtes sélectionné pour un entretien',
        nextStep: 'Entretien technique',
        interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        jobTitle: 'DevOps Engineer',
        companyName: 'Free Sénégal',
        location: 'Dakar',
        appliedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'rejected',
        statusMessage: 'Nous vous remercions pour votre candidature'
      },
      {
        id: '5',
        jobTitle: 'Développeur Mobile Flutter',
        companyName: 'Cauri Money',
        location: 'Dakar',
        appliedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'pending',
        statusMessage: 'Votre candidature a bien été reçue'
      }
    ];
  }

  filterApplications() {
    if (this.selectedStatus === 'all') {
      this.filteredApplications = [...this.applications];
    } else {
      this.filteredApplications = this.applications.filter(
        app => app.status === this.selectedStatus
      );
    }
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.filterApplications();
  }

  getStatusConfig(status: string): { label: string; color: string; bg: string; icon: string } {
    const configs: Record<string, any> = {
      pending: { label: 'En attente', color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
      reviewed: { label: 'Consultée', color: '#3b82f6', bg: '#eff6ff', icon: '👁️' },
      interview: { label: 'Entretien', color: '#8b5cf6', bg: '#f3e8ff', icon: '🎯' },
      accepted: { label: 'Acceptée', color: '#00b894', bg: '#ecfdf5', icon: '✅' },
      rejected: { label: 'Refusée', color: '#ef4444', bg: '#fef2f2', icon: '❌' }
    };
    return configs[status] || configs['pending'];
  }

  openApplicationDetail(app: Application) {
    this.selectedApp = app;
    this.showDetailModal = true;
  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedApp = null;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  }

  getStatusCount(status: string): number {
    if (status === 'all') return this.applications.length;
    return this.applications.filter(app => app.status === status).length;
  }

  navigateToOffers() {
    this.router.navigate(['/candidate/offers']);
  }
}
