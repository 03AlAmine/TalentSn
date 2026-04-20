import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RecruiterService, JobOffer } from '../../../core/services/recruiter.service';
import {
  Firestore, collection, addDoc, serverTimestamp,
  query, where, getDocs, updateDoc, doc, increment
} from '@angular/fire/firestore';
import { inject } from '@angular/core';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private recruiterService = inject(RecruiterService);

  offer: JobOffer | null = null;
  isLoading = true;
  notFound = false;

  // Application form
  showForm = false;
  coverLetter = '';
  formLoading = false;
  formSuccess = false;
  formError = '';
  alreadyApplied = false;

  userData: any = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound = true; this.isLoading = false; return; }

    this.authService.userData$.subscribe(u => { this.userData = u; });

    this.recruiterService.getJobOffer(id).then(offer => {
      if (!offer) { this.notFound = true; }
      else { this.offer = offer; this.checkIfApplied(); }
      this.isLoading = false;
    });
  }

  async checkIfApplied() {
    const uid = this.authService.getCurrentUser()?.uid;
    if (!uid || !this.offer?.id) return;
    const q = query(
      collection(this.firestore, 'applications'),
      where('jobId', '==', this.offer.id),
      where('candidateId', '==', uid)
    );
    const snap = await getDocs(q);
    this.alreadyApplied = !snap.empty;
  }

  openApply() {
    const u = this.authService.getCurrentUser();
    if (!u) { this.router.navigate(['/login']); return; }
    if (this.userData?.role !== 'candidate') { this.formError = 'Seuls les candidats peuvent postuler.'; return; }
    this.showForm = true;
    this.formError = '';
  }

  async submitApplication() {
    const u = this.authService.getCurrentUser();
    if (!u || !this.offer?.id) return;
    this.formLoading = true;
    this.formError = '';

    try {
      const cv = this.userData;
      await addDoc(collection(this.firestore, 'applications'), {
        jobId: this.offer.id,
        jobTitle: this.offer.title,
        candidateId: u.uid,
        candidateName: `${cv?.firstName || ''} ${cv?.lastName || ''}`.trim(),
        candidateEmail: u.email,
        candidatePhoto: cv?.photoURL || '',
        candidateTitle: cv?.title || '',
        candidateCity: cv?.city || '',
        candidateSector: cv?.sector || '',
        candidateExperience: cv?.experienceYears || '',
        candidateEducation: cv?.educationLevel || '',
        coverLetter: this.coverLetter.trim(),
        status: 'new',
        cvData: cv?.cvData || null,
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // increment applicationCount
      await updateDoc(doc(this.firestore, 'jobOffers', this.offer.id), {
        applicationCount: increment(1)
      });

      this.formSuccess = true;
      this.alreadyApplied = true;
      this.showForm = false;
    } catch (e: any) {
      this.formError = e.message || 'Une erreur est survenue.';
    } finally {
      this.formLoading = false;
    }
  }

  get formattedSalary() {
    return this.recruiterService.formatSalary(this.offer?.salaryMin, this.offer?.salaryMax, this.offer?.salaryCurrency);
  }

  formatDate(ts: any): string {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  }

  getRemoteLabel(r?: string) {
    return { onsite:'Présentiel', hybrid:'Hybride', 'full-remote':'Full Remote' }[r || ''] || r;
  }
}
