import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent {
  currentStep: number = 1;
  genStep: number = 0;

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
    {
      name: '',
      issuer: ''
    }
  ];

  technicalSkills: string[] = ['Angular', 'React', 'Node.js'];
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

  nextStep(): void {
    if (this.currentStep < 5) {
      this.currentStep++;
      window.scrollTo(0, 0);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  addExperience(): void {
    this.experiences.push({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      location: '',
      description: ''
    });
  }

  removeExperience(index: number): void {
    if (this.experiences.length > 1) {
      this.experiences.splice(index, 1);
    }
  }

  addEducation(): void {
    this.educations.push({
      degree: '',
      institution: '',
      startYear: 0,
      endYear: 0,
      location: ''
    });
  }

  removeEducation(index: number): void {
    if (this.educations.length > 1) {
      this.educations.splice(index, 1);
    }
  }

  addCertification(): void {
    this.certifications.push({ name: '', issuer: '' });
  }

  removeCertification(index: number): void {
    if (this.certifications.length > 1) {
      this.certifications.splice(index, 1);
    }
  }

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

  addLanguage(): void {
    this.languages.push({ name: '', level: 'courant' });
  }

  removeLanguage(index: number): void {
    if (this.languages.length > 1) {
      this.languages.splice(index, 1);
    }
  }

  async generateCV(): Promise<void> {
    this.currentStep = 5;
    window.scrollTo(0, 0);

    // Simuler la génération IA étape par étape
    for (let i = 1; i <= 5; i++) {
      this.genStep = i;
      await this.delay(1500);
    }

    // Sauvegarder toutes les données dans Firebase
    await this.saveProfileData();
    
    // Rediriger vers le dashboard candidat
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
        onboardingCompleted: true,
        completedAt: new Date()
      };
      
      await this.authService.updateUserData(user.uid, profileData as any);
    }
  }
}