import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  RecruiterService,
  Application,
  JobOffer,
  ApplicationStatus,
} from '../../../../core/services/recruiter.service';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css'],
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  applicationId: string | null = null;
  application: Application | null = null;
  jobOffer: JobOffer | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  notes: string = '';
  isEditingNotes = false;

  showInterviewModal = false;
  interviewData = {
    date: '',
    time: '',
    duration: 60,
    type: 'video',
    location: '',
    meetingLink: '',
    notes: '',
  };

  showFeedbackModal = false;
  feedbackData = {
    message: '',
    rating: 3,
  };

  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recruiterService: RecruiterService,
  ) {}

  async ngOnInit() {
    this.applicationId = this.route.snapshot.paramMap.get('id');
    if (this.applicationId) {
      await this.loadApplication();
    } else {
      this.router.navigate(['/recruiter/applications']);
    }

    this.refreshInterval = setInterval(() => {
      if (this.applicationId && !this.isEditingNotes) {
        this.loadApplication(false);
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadApplication(showLoader: boolean = true) {
    if (showLoader) this.isLoading = true;
    try {
      const allApps = await this.recruiterService.getAllMyApplications();
      const found = allApps.find((a) => a.id === this.applicationId);

      if (found) {
        this.application = found;
        this.notes = found.notes || '';

        if (found.jobId) {
          const offers = await this.recruiterService.getMyJobOffers();
          this.jobOffer = offers.find((o) => o.id === found.jobId) || null;
        }

        if (this.application.status === 'new') {
          await this.updateStatus('viewed', false);
        }
      } else {
        this.errorMessage = 'Candidature non trouvée';
      }
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement de la candidature';
    } finally {
      if (showLoader) this.isLoading = false;
    }
  }

  async updateStatus(newStatus: ApplicationStatus, showFeedback: boolean = true) {
    if (!this.application) return;

    try {
      await this.recruiterService.updateApplicationStatus(
        this.application.id!,
        newStatus,
        this.notes,
      );
      this.application.status = newStatus;
      await this.recruiterService.refreshStats();

      if (showFeedback) {
        this.successMessage = `Statut mis à jour : ${this.getStatusLabel(newStatus)}`;
        setTimeout(() => (this.successMessage = ''), 3000);
      }
    } catch (error) {
      this.errorMessage = 'Erreur lors de la mise à jour du statut';
      setTimeout(() => (this.errorMessage = ''), 3000);
    }
  }

  async saveNotes() {
    if (!this.application) return;

    this.isSaving = true;
    try {
      await this.recruiterService.updateApplicationStatus(
        this.application.id!,
        this.application.status,
        this.notes,
      );
      this.application.notes = this.notes;
      this.isEditingNotes = false;
      this.successMessage = 'Notes enregistrées';
      setTimeout(() => (this.successMessage = ''), 2000);
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'enregistrement des notes';
      setTimeout(() => (this.errorMessage = ''), 3000);
    } finally {
      this.isSaving = false;
    }
  }

  async rateApplication(rating: number) {
    if (!this.application) return;

    try {
      await this.recruiterService.rateApplication(this.application.id!, rating);
      this.application.rating = rating;
      this.successMessage = `Évaluation : ${rating}/5 étoiles`;
      setTimeout(() => (this.successMessage = ''), 2000);
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'évaluation';
      setTimeout(() => (this.errorMessage = ''), 3000);
    }
  }

  async sendInterviewInvitation() {
    if (!this.application) return;

    const { date, time, duration, type, location, meetingLink, notes } = this.interviewData;

    if (!date || !time) {
      this.errorMessage = 'Veuillez renseigner la date et l\'heure';
      return;
    }

    this.isSaving = true;
    try {
      await this.updateStatus('interview', false);
      this.showInterviewModal = false;
      this.successMessage = 'Invitation envoyée au candidat';
      setTimeout(() => (this.successMessage = ''), 3000);

      this.interviewData = {
        date: '',
        time: '',
        duration: 60,
        type: 'video',
        location: '',
        meetingLink: '',
        notes: '',
      };
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'envoi de l\'invitation';
    } finally {
      this.isSaving = false;
    }
  }

  async sendRejectionFeedback() {
    if (!this.application) return;

    this.isSaving = true;
    try {
      await this.updateStatus('rejected', false);
      this.showFeedbackModal = false;
      this.successMessage = 'Réponse envoyée au candidat';
      setTimeout(() => (this.successMessage = ''), 3000);

      this.feedbackData = { message: '', rating: 3 };
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'envoi du refus';
    } finally {
      this.isSaving = false;
    }
  }

  viewCV() {
    if (this.application?.candidateId) {
      window.open(`/cv/${this.application.candidateId}`, '_blank');
    }
  }

  goBack() {
    if (this.application?.jobId) {
      this.router.navigate(['/recruiter/applications'], { queryParams: { offerId: this.application.jobId } });
    } else {
      this.router.navigate(['/recruiter/applications']);
    }
  }

  getStatusLabel(status: ApplicationStatus): string {
    const config = this.recruiterService.appStatusConfig[status];
    return config?.label || status;
  }

  getStatusColor(status: ApplicationStatus): string {
    const config = this.recruiterService.appStatusConfig[status];
    return config?.color || '#6b7683';
  }

  getStatusBg(status: ApplicationStatus): string {
    const config = this.recruiterService.appStatusConfig[status];
    return config?.bg || 'rgba(107, 118, 131, 0.1)';
  }

  formatDate(ts: any): string {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getRelativeDate(ts: any): string {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  }

  stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  get appStatusKeys(): ApplicationStatus[] {
    return Object.keys(this.recruiterService.appStatusConfig) as ApplicationStatus[];
  }
}
