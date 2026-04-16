import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CvUploadComponent } from '../cv-upload/cv-upload.component';
import { ExtractedProfile } from '../../services/cv-parser.service';

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  startYear: number;
  endYear: number;
  location: string;
}

interface Certification {
  name: string;
  issuer: string;
}

interface Language {
  name: string;
  level: string;
}

interface AdditionalInfo {
  summary: string;
  github: string;
  linkedin: string;
  contractType: string;
  availability: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, CvUploadComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent {
  // Step 0 = upload CV / Step 1–5 = formulaire
  currentStep: number = 0;
  genStep: number = 0;
  cvFilled: boolean = false; // true si l'upload CV a pré-rempli les données

  experiences: Experience[] = [
    {
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      location: '',
      description: ''
    }
  ];

  educations: Education[] = [
    {
      degree: '',
      institution: '',
      startYear: 0,
      endYear: 0,
      location: ''
    }
  ];

  certifications: Certification[] = [
    { name: '', issuer: '' }
  ];

  technicalSkills: string[] = [];
  softSkills: string[] = [];

  techSuggestions: string[] = ['TypeScript', 'Python', 'Firebase', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'MongoDB'];
  softSuggestions: string[] = ['Leadership', 'Travail en équipe', 'Gestion de projet', 'Communication', 'Autonomie'];

  languages: Language[] = [
    { name: 'Français', level: 'maternelle' },
    { name: 'Anglais', level: 'courant' }
  ];

  additionalInfo: AdditionalInfo = {
    summary: '',
    github: '',
    linkedin: '',
    contractType: 'CDI',
    availability: 'Immédiate'
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ──────────────────────────────────────────
  // GESTION UPLOAD CV (Step 0)
  // ──────────────────────────────────────────

  /**
   * Appelé quand le composant cv-upload émet un profil extrait
   */
  onProfileExtracted(profile: ExtractedProfile): void {
    this.cvFilled = true;

    // ── Expériences
    if (profile.experiences.length > 0 && profile.experiences[0].title) {
      this.experiences = profile.experiences.map(exp => ({
        title: exp.title || '',
        company: exp.company || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        isCurrent: exp.isCurrent || false,
        location: exp.location || '',
        description: exp.description || ''
      }));
    }

    // ── Formations
    if (profile.educations.length > 0 && profile.educations[0].degree) {
      this.educations = profile.educations.map(edu => ({
        degree: edu.degree || '',
        institution: edu.institution || '',
        startYear: edu.startYear || 0,
        endYear: edu.endYear || 0,
        location: edu.location || ''
      }));
    }

    // ── Compétences
    if (profile.technicalSkills.length > 0) {
      this.technicalSkills = [...profile.technicalSkills];
    }
    if (profile.softSkills.length > 0) {
      this.softSkills = [...profile.softSkills];
    }

    // ── Langues
    if (profile.languages.length > 0) {
      this.languages = profile.languages.map(l => ({
        name: l.name,
        level: l.level
      }));
    }

    // ── Certifications
    if (profile.certifications.length > 0 && profile.certifications[0].name) {
      this.certifications = profile.certifications.map(c => ({
        name: c.name,
        issuer: c.issuer
      }));
    }

    // ── Informations complémentaires
    if (profile.summary) this.additionalInfo.summary = profile.summary;
    if (profile.github) this.additionalInfo.github = profile.github;
    if (profile.linkedin) this.additionalInfo.linkedin = profile.linkedin;

    // Passer directement à l'étape 1 avec les données pré-remplies
    this.currentStep = 1;
    window.scrollTo(0, 0);
  }

  /**
   * Appelé si l'utilisateur veut remplir le formulaire manuellement
   */
  onSkipUpload(): void {
    this.cvFilled = false;
    this.currentStep = 1;
    window.scrollTo(0, 0);
  }

  // ──────────────────────────────────────────
  // NAVIGATION ENTRE ÉTAPES
  // ──────────────────────────────────────────

  nextStep(): void {
    if (this.currentStep < 5) {
      this.currentStep++;
      window.scrollTo(0, 0);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else if (this.currentStep === 1) {
      this.currentStep = 0; // Retour à l'upload CV
    }
    window.scrollTo(0, 0);
  }

  // ──────────────────────────────────────────
  // GESTION DES EXPÉRIENCES
  // ──────────────────────────────────────────

  addExperience(): void {
    this.experiences.push({
      title: '', company: '', startDate: '', endDate: '',
      isCurrent: false, location: '', description: ''
    });
  }

  removeExperience(index: number): void {
    if (this.experiences.length > 1) {
      this.experiences.splice(index, 1);
    }
  }

  // ──────────────────────────────────────────
  // GESTION DES FORMATIONS
  // ──────────────────────────────────────────

  addEducation(): void {
    this.educations.push({
      degree: '', institution: '', startYear: 0, endYear: 0, location: ''
    });
  }

  removeEducation(index: number): void {
    if (this.educations.length > 1) {
      this.educations.splice(index, 1);
    }
  }

  // ──────────────────────────────────────────
  // GESTION DES CERTIFICATIONS
  // ──────────────────────────────────────────

  addCertification(): void {
    this.certifications.push({ name: '', issuer: '' });
  }

  removeCertification(index: number): void {
    if (this.certifications.length > 1) {
      this.certifications.splice(index, 1);
    }
  }

  // ──────────────────────────────────────────
  // GESTION DES COMPÉTENCES
  // ──────────────────────────────────────────

  addTechnicalSkill(skill: string): void {
    if (skill.trim() && !this.technicalSkills.includes(skill.trim())) {
      this.technicalSkills.push(skill.trim());
    }
  }

  removeTechnicalSkill(index: number): void {
    this.technicalSkills.splice(index, 1);
  }

  addSoftSkill(skill: string): void {
    if (skill.trim() && !this.softSkills.includes(skill.trim())) {
      this.softSkills.push(skill.trim());
    }
  }

  removeSoftSkill(index: number): void {
    this.softSkills.splice(index, 1);
  }

  // ──────────────────────────────────────────
  // GESTION DES LANGUES
  // ──────────────────────────────────────────

  addLanguage(): void {
    this.languages.push({ name: '', level: 'courant' });
  }

  removeLanguage(index: number): void {
    if (this.languages.length > 1) {
      this.languages.splice(index, 1);
    }
  }

  // ──────────────────────────────────────────
  // GÉNÉRATION IA & SAUVEGARDE
  // ──────────────────────────────────────────

  async generateCV(): Promise<void> {
    this.currentStep = 5;
    window.scrollTo(0, 0);

    for (let i = 1; i <= 5; i++) {
      this.genStep = i;
      await this.delay(1500);
    }

    await this.saveProfileData();
    this.router.navigate(['/candidate/dashboard']);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async saveProfileData(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (user) {
      const profileData = {
        experiences: this.experiences,
        educations: this.educations,
        certifications: this.certifications,
        technicalSkills: this.technicalSkills,
        softSkills: this.softSkills,
        languages: this.languages,
        additionalInfo: this.additionalInfo,
        cvAutoFilled: this.cvFilled,
        onboardingCompleted: true,
        completedAt: new Date()
      };
      await this.authService.updateUserData(user.uid, profileData as any);
    }
  }
}
