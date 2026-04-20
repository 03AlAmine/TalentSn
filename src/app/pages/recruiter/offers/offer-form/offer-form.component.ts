import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruiterService, JobOffer } from '../../../../core/services/recruiter.service';
import { AuthService, UserData } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-offer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './offer-form.component.html',
  styleUrls: ['./offer-form.component.css'],
})
export class OfferFormComponent implements OnInit {
  isEditMode = false;
  offerId: string | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  userData: UserData | null = null;

  offer: Partial<JobOffer> = {
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
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: 'XOF',
    status: 'active',
  };

  newSkill = '';
  newResponsibility = '';
  newRequirement = '';
  newNiceToHave = '';
  newBenefit = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recruiterService: RecruiterService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.authService.userData$.subscribe(data => {
      this.userData = data;
      if (!this.isEditMode) {
        this.offer.companyName = data?.companyName || '';
      }
    });

    this.offerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.offerId;

    if (this.isEditMode && this.offerId) {
      await this.loadOffer();
    } else {
      this.isLoading = false;
    }
  }

  async loadOffer() {
    this.isLoading = true;
    try {
      const offers = await this.recruiterService.getMyJobOffers();
      const found = offers.find(o => o.id === this.offerId);
      if (found) {
        this.offer = { ...found };
      } else {
        this.errorMessage = 'Offre non trouvée';
      }
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement de l\'offre';
    } finally {
      this.isLoading = false;
    }
  }

  addTag(field: keyof Pick<JobOffer, 'skills' | 'responsibilities' | 'requirements' | 'niceToHave' | 'benefits'>, value: string) {
    if (!value.trim()) return;
    const arr = (this.offer[field] as string[]) || [];
    if (!arr.includes(value.trim())) {
      arr.push(value.trim());
      this.offer[field] = arr;
    }
    this.clearTempField(field);
  }

  removeTag(field: keyof Pick<JobOffer, 'skills' | 'responsibilities' | 'requirements' | 'niceToHave' | 'benefits'>, index: number) {
    const arr = (this.offer[field] as string[]) || [];
    arr.splice(index, 1);
    this.offer[field] = [...arr];
  }

  private clearTempField(field: string) {
    switch (field) {
      case 'skills': this.newSkill = ''; break;
      case 'responsibilities': this.newResponsibility = ''; break;
      case 'requirements': this.newRequirement = ''; break;
      case 'niceToHave': this.newNiceToHave = ''; break;
      case 'benefits': this.newBenefit = ''; break;
    }
  }

  onTagKeydown(event: KeyboardEvent, field: any, value: string) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag(field, value);
    }
  }

  isValid(): boolean {
    if (!this.offer.title?.trim()) return false;
    if (!this.offer.description?.trim()) return false;
    if (!this.offer.sector) return false;
    if (!this.offer.location?.trim()) return false;
    return true;
  }

  async saveOffer(publish: boolean = true) {
    if (!this.isValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (titre, description, secteur, localisation)';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      if (publish) {
        this.offer.status = 'active';
      } else {
        this.offer.status = 'draft';
      }

      if (this.isEditMode && this.offerId) {
        await this.recruiterService.updateJobOffer(this.offerId, this.offer);
        this.successMessage = 'Offre mise à jour avec succès';
      } else {
        await this.recruiterService.createJobOffer(this.offer);
        this.successMessage = 'Offre publiée avec succès';
      }

      setTimeout(() => {
        this.router.navigate(['/recruiter/offers']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage = error.message || 'Une erreur est survenue';
    } finally {
      this.isSaving = false;
    }
  }

  get sectors() { return this.recruiterService.sectors; }
  get jobTypes() { return this.recruiterService.jobTypes; }
  get experienceLevels() { return this.recruiterService.experienceLevels; }
  get educationLevels() { return this.recruiterService.educationLevels; }
  get remoteOptions() { return this.recruiterService.remoteOptions; }

  getJobTypeColor(type: string): string {
    const map: Record<string, string> = {
      CDI: '#2ecc9f', CDD: '#3b82f6', Stage: '#f59e0b',
      Freelance: '#a855f7', Alternance: '#ec4899', 'Temps partiel': '#6b7280',
    };
    return map[type] || '#2ecc9f';
  }

  cancel() {
    this.router.navigate(['/recruiter/offers']);
  }
}
