import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruiterService, JobOffer } from '../../../../core/services/recruiter.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

interface TalentProfile {
  id: string;
  uid?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  title?: string;
  city?: string;
  country?: string;
  sector?: string;
  experienceYears?: string;
  educationLevel?: string;
  about?: string;
  cvData?: {
    summary?: string;
    technicalSkills?: string[];
    softSkills?: string[];
    experiences?: Array<{
      position: string;
      company: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    education?: Array<{
      degree: string;
      field: string;
      institution: string;
      startDate: string;
      endDate?: string;
    }>;
    languages?: Array<{
      language: string;
      level: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string[];
      link?: string;
    }>;
  };
  createdAt?: any;
  updatedAt?: any;
}

@Component({
  selector: 'app-talent-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './talent-profile.component.html',
  styleUrls: ['./talent-profile.component.css'],
})
export class TalentProfileComponent implements OnInit {
  candidateId: string | null = null;
  candidate: TalentProfile | null = null;
  isLoading = true;
  errorMessage = '';

  // Contact modal
  showContactModal = false;
  contactMessage = '';
  selectedOfferId = '';
  jobOffers: JobOffer[] = [];

  // Active tab
  activeTab: 'profile' | 'experience' | 'education' | 'skills' | 'projects' = 'profile';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recruiterService: RecruiterService,
    private firestore: Firestore,
  ) {}

  async ngOnInit() {
    this.candidateId = this.route.snapshot.paramMap.get('id');
    if (this.candidateId) {
      await this.loadCandidateProfile();
      await this.loadJobOffers();
    } else {
      this.router.navigate(['/recruiter/talents']);
    }
  }

  async loadCandidateProfile() {
    this.isLoading = true;
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', this.candidateId!));
      if (userDoc.exists()) {
        this.candidate = { id: userDoc.id, ...userDoc.data() } as TalentProfile;
      } else {
        this.errorMessage = 'Profil non trouvé';
      }
    } catch (error) {
      console.error('Error loading candidate profile:', error);
      this.errorMessage = 'Erreur lors du chargement du profil';
    } finally {
      this.isLoading = false;
    }
  }

  async loadJobOffers() {
    this.jobOffers = await this.recruiterService.getMyJobOffers();
  }

  async sendContactMessage() {
    if (!this.contactMessage.trim()) {
      return;
    }

    // Here you would implement sending a message to the candidate
    // For now, we'll just show a success message
    console.log('Sending message to candidate:', {
      candidateId: this.candidateId,
      candidateEmail: this.candidate?.email,
      offerId: this.selectedOfferId,
      message: this.contactMessage,
    });

    this.showContactModal = false;
    this.contactMessage = '';
    this.selectedOfferId = '';

    // Show success notification (you can implement a toast service)
    alert('Message envoyé au candidat avec succès !');
  }

  viewCV() {
    if (this.candidateId) {
      window.open(`/cv/${this.candidateId}`, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/recruiter/talents']);
  }

  getFullName(): string {
    if (!this.candidate) return '';
    return `${this.candidate.firstName} ${this.candidate.lastName}`.trim();
  }

  getInitials(): string {
    if (!this.candidate) return '?';
    return `${this.candidate.firstName?.[0] || ''}${this.candidate.lastName?.[0] || ''}`.toUpperCase();
  }

  getExperienceLevel(): string {
    const levelMap: Record<string, string> = {
      'Junior (0-2 ans)': 'Débutant',
      'Confirmé (3-5 ans)': 'Confirmé',
      'Senior (5-10 ans)': 'Senior',
      'Expert (10+ ans)': 'Expert',
    };
    return levelMap[this.candidate?.experienceYears || ''] || this.candidate?.experienceYears || 'Non spécifié';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  }

  getYearsOfExperience(experiences?: any[]): number {
    if (!experiences?.length) return 0;

    let totalYears = 0;
    for (const exp of experiences) {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        totalYears += years;
      }
    }
    return Math.round(totalYears);
  }
  getLevelWidth(level: string): string {
  const levelMap: Record<string, number> = {
    'Débutant': 25,
    'Intermédiaire': 50,
    'Avancé': 75,
    'Courant': 90,
    'Natif': 100,
    'Notions': 20,
    'Professionnel': 70,
  };
  return `${levelMap[level] || 50}%`;
}
}
