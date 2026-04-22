// candidate-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserData, CvData } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface Suggestion {
  message: string;
  action?: string;
  actionLink?: string;
}

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-dashboard.component.html',
  styleUrls: ['./candidate-dashboard.component.css']
})
export class CandidateDashboardComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;
  private subscriptions = new Subscription();

  stats: StatCard[] = [];
  suggestions: Suggestion[] = [];
  recentActivities: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.authService.userData$.subscribe(data => {
        this.userData = data;
        this.isLoading = false;
        this.loadStats();
        this.loadSuggestions();
        this.loadRecentActivities();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadStats() {
    const cv = this.userData?.cvData;
    this.stats = [
      { label: 'Expériences', value: cv?.experiences?.length || 0, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: '#00b894' },
      { label: 'Compétences', value: (cv?.technicalSkills?.length || 0) + (cv?.softSkills?.length || 0), icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 7h14M5 17h14M3 3h18v18H3z', color: '#6366f1' },
      { label: 'Formations', value: cv?.educations?.length || 0, icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', color: '#f59e0b' },
      { label: 'Langues', value: cv?.languages?.length || 0, icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', color: '#8b5cf6' }
    ];
  }

  private loadSuggestions() {
    this.suggestions = [];
    const cv = this.userData?.cvData;

    if (!this.userData?.photoURL) {
      this.suggestions.push({ message: 'Ajoutez une photo de profil', action: 'Ajouter', actionLink: '/candidate/profile' });
    }
    if (!cv?.summary) {
      this.suggestions.push({ message: 'Rédigez un résumé professionnel', action: 'Rédiger', actionLink: '/candidate/cv' });
    }
    if ((cv?.experiences?.length || 0) < 2) {
      this.suggestions.push({ message: 'Ajoutez plus d\'expériences', action: 'Ajouter', actionLink: '/candidate/cv' });
    }
    if ((cv?.technicalSkills?.length || 0) < 5) {
      this.suggestions.push({ message: 'Ajoutez des compétences techniques', action: 'Ajouter', actionLink: '/candidate/cv' });
    }
    if (!cv?.additionalInfo?.linkedin) {
      this.suggestions.push({ message: 'Ajoutez votre profil LinkedIn', action: 'Ajouter', actionLink: '/candidate/cv' });
    }
  }

  private loadRecentActivities() {
    // À remplacer par des données réelles de Firestore
    this.recentActivities = [
      { type: 'application', message: 'Candidature envoyée pour Développeur Full Stack', date: new Date(), status: 'pending' },
      { type: 'view', message: 'Votre CV a été consulté par ABC Corp', date: new Date(), status: 'viewed' }
    ];
  }

  get fullName(): string {
    return `${this.userData?.firstName || ''} ${this.userData?.lastName || ''}`.trim() || 'Candidat';
  }

  get title(): string {
    return this.userData?.title || 'Développeur';
  }

  get location(): string {
    return [this.userData?.city, this.userData?.country].filter(Boolean).join(', ');
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  get profileCompletion(): number {
    if (!this.userData) return 0;
    const cv = this.userData.cvData;
    let score = 0;
    if (this.userData.firstName) score += 5;
    if (this.userData.lastName) score += 5;
    if (this.userData.photoURL) score += 10;
    if (this.userData.title) score += 10;
    if (this.userData.phone) score += 5;
    if (cv?.summary) score += 15;
    if ((cv?.experiences?.length || 0) > 0) score += 15;
    if ((cv?.technicalSkills?.length || 0) > 0) score += 10;
    if ((cv?.educations?.length || 0) > 0) score += 10;
    if ((cv?.languages?.length || 0) > 0) score += 5;
    if (cv?.additionalInfo?.linkedin) score += 5;
    if (cv?.additionalInfo?.github) score += 5;
    return Math.min(score, 100);
  }

  get hasCV(): boolean {
    return !!this.userData?.cvData;
  }

  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      application: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      view: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
    };
    return icons[type] || icons['application'];
  }

  getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      application: '#f59e0b',
      view: '#6366f1'
    };
    return colors[type] || '#64748b';
  }

  navigateToCV() {
    this.router.navigate(['/candidate/cv']);
  }

  navigateToProfile() {
    this.router.navigate(['/candidate/profile']);
  }
}
