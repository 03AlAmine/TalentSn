import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-dashboard.component.html',
  styleUrls: ['./candidate-dashboard.component.css'],
})
export class CandidateDashboardComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;
  activeSection = 'tableau-de-bord';
  isUploadingPhoto = false;
  sidebarOpen = false;
  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.sub = this.authService.userData$.subscribe((data) => {
      this.userData = data;
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get firstName() {
    return this.userData?.firstName || '';
  }
  get lastName() {
    return this.userData?.lastName || '';
  }
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim() || 'Candidat';
  }
  get title() {
    return this.userData?.title || 'Titre professionnel non renseigné';
  }
  get city() {
    return this.userData?.city || '';
  }
  get country() {
    return this.userData?.country || '';
  }
  get sector() {
    return this.userData?.sector || '';
  }
  get photoURL() {
    return this.userData?.photoURL || '';
  }
  get email() {
    return this.userData?.email || '';
  }
  get phone() {
    return this.userData?.phone || '';
  }
  get hasCV() {
    return !!this.userData?.cvData;
  }
  get cvTheme() {
    return this.userData?.cvData?.theme || 'green';
  }

  get profileCompletion(): number {
    if (!this.userData) return 0;
    const cv = this.userData.cvData;
    let s = 0;
    if (this.userData.firstName) s += 10;
    if (this.userData.title) s += 10;
    if (this.userData.photoURL) s += 15;
    if (cv?.summary) s += 15;
    if (cv?.experiences?.length) s += 15;
    if (cv?.technicalSkills?.length) s += 10;
    if (cv?.educations?.length) s += 10;
    if (cv?.languages?.length) s += 5;
    if (this.userData.phone) s += 5;
    if (cv?.additionalInfo?.linkedin) s += 5;
    return Math.min(s, 100);
  }

  get cvStats() {
    const cv = this.userData?.cvData;
    return {
      skills:
        (cv?.technicalSkills?.length || 0) + (cv?.softSkills?.length || 0),
      experiences: cv?.experiences?.length || 0,
      educations: cv?.educations?.length || 0,
      languages: cv?.languages?.length || 0,
    };
  }

  get suggestions(): string[] {
    const t: string[] = [];
    if (!this.userData?.photoURL)
      t.push('Ajoutez une photo — +40% de visibilité');
    if (!this.userData?.cvData?.summary)
      t.push('Rédigez votre résumé professionnel');
    if (!this.userData?.cvData?.experiences?.length)
      t.push('Ajoutez vos expériences');
    if ((this.userData?.cvData?.technicalSkills?.length || 0) < 3)
      t.push('Ajoutez au moins 3 compétences techniques');
    if (!this.userData?.cvData?.additionalInfo?.linkedin)
      t.push('Ajoutez votre profil LinkedIn');
    return t.slice(0, 3);
  }

  get greetingTime() {
    const h = new Date().getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  }

  get completionDash(): string {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const offset = circ - (circ * this.profileCompletion) / 100;
    return `${circ} ${offset}`;
  }

  navigate(section: string) {
    this.activeSection = section;
    this.sidebarOpen = false;
  }

  goToCV() {
    this.router.navigate(['/candidate/cv']);
  }
  goToOnboarding() {
    this.router.navigate(['/onboarding']);
  }

  async onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.isUploadingPhoto = true;
    try {
      await this.authService.uploadProfilePhoto(user.uid, file);
    } catch (e) {
      console.error(e);
    } finally {
      this.isUploadingPhoto = false;
    }
  }

  async logout() {
    await this.authService.logout();
  }
}
