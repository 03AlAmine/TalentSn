import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  collectionData,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map } from 'rxjs/operators';

/* ────────────────── INTERFACES ────────────────── */

export type JobType =
  | 'CDI'
  | 'CDD'
  | 'Stage'
  | 'Freelance'
  | 'Alternance'
  | 'Temps partiel';
export type JobStatus = 'active' | 'paused' | 'closed' | 'draft';
export type ApplicationStatus =
  | 'new'
  | 'viewed'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'rejected';
export type ExperienceLevel =
  | 'Junior (0-2 ans)'
  | 'Confirmé (3-5 ans)'
  | 'Senior (5-10 ans)'
  | 'Expert (10+ ans)';

export interface JobOffer {
  id?: string;
  recruiterId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  sector: string;
  type: JobType;
  location: string;
  remote: 'onsite' | 'hybrid' | 'full-remote';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  experienceLevel: ExperienceLevel;
  educationLevel: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  skills: string[];
  status: JobStatus;
  applicationCount: number;
  viewCount: number;
  createdAt: any;
  updatedAt: any;
  closingDate?: string;
  urgent: boolean;
}

export interface Application {
  id?: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhoto?: string;
  candidateTitle?: string;
  candidateCity?: string;
  candidateSector?: string;
  candidateExperience?: string;
  candidateEducation?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: any;
  updatedAt: any;
  notes?: string;
  rating?: number;
  cvData?: any;
}

export interface RecruiterStats {
  totalOffers: number;
  activeOffers: number;
  newOffers: number; // Ajouté pour le trend
  totalApplications: number;
  newApplications: number;
  shortlisted: number;
  interviews: number;
}

/* ────────────────── SERVICE ────────────────── */

@Injectable({ providedIn: 'root' })
export class RecruiterService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private statsSubject = new BehaviorSubject<RecruiterStats>({
    totalOffers: 0,
    activeOffers: 0,
    totalApplications: 0,
    newApplications: 0,
    shortlisted: 0,
    interviews: 0,
    newOffers: 0
  });
  stats$ = this.statsSubject.asObservable();

  get currentUid(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /* ── JOB OFFERS ── */

  async createJobOffer(data: Partial<JobOffer>): Promise<string> {
    const uid = this.currentUid;
    if (!uid) throw new Error('Non authentifié');

    const offer: Partial<JobOffer> = {
      ...data,
      recruiterId: uid,
      status: data.status || 'active',
      applicationCount: 0,
      viewCount: 0,
      urgent: data.urgent || false,
      salaryCurrency: data.salaryCurrency || 'XOF',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(this.firestore, 'jobOffers'), offer);
    await this.refreshStats();
    return ref.id;
  }

  async updateJobOffer(
    offerId: string,
    data: Partial<JobOffer>,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'jobOffers', offerId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    await this.refreshStats();
  }

  async deleteJobOffer(offerId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'jobOffers', offerId));
    await this.refreshStats();
  }

  async getMyJobOffers(): Promise<JobOffer[]> {
    const uid = this.currentUid;
    if (!uid) return [];
    const q = query(
      collection(this.firestore, 'jobOffers'),
      where('recruiterId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JobOffer);
  }

  watchMyJobOffers(): Observable<JobOffer[]> {
    const uid = this.currentUid;
    if (!uid) return new Observable((obs) => obs.next([]));
    const q = query(
      collection(this.firestore, 'jobOffers'),
      where('recruiterId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobOffer[]>;
  }

  async getJobOffer(offerId: string): Promise<JobOffer | null> {
    const snap = await getDoc(doc(this.firestore, 'jobOffers', offerId));
    if (!snap.exists()) return null;
    // increment view
    await updateDoc(doc(this.firestore, 'jobOffers', offerId), {
      viewCount: (snap.data()['viewCount'] || 0) + 1,
    });
    return { id: snap.id, ...snap.data() } as JobOffer;
  }

  /* ── APPLICATIONS ── */

  async getApplicationsForOffer(offerId: string): Promise<Application[]> {
    const q = query(
      collection(this.firestore, 'applications'),
      where('jobId', '==', offerId),
      orderBy('appliedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application);
  }

  watchApplicationsForOffer(offerId: string): Observable<Application[]> {
    const q = query(
      collection(this.firestore, 'applications'),
      where('jobId', '==', offerId),
      orderBy('appliedAt', 'desc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Application[]>;
  }

  async getAllMyApplications(): Promise<Application[]> {
    const offers = await this.getMyJobOffers();
    if (!offers.length) return [];
    const offerIds = offers.map((o) => o.id!);

    // Firestore 'in' limited to 10; chunk if needed
    const chunks: string[][] = [];
    for (let i = 0; i < offerIds.length; i += 10)
      chunks.push(offerIds.slice(i, i + 10));

    const all: Application[] = [];
    for (const chunk of chunks) {
      const q = query(
        collection(this.firestore, 'applications'),
        where('jobId', 'in', chunk),
        orderBy('appliedAt', 'desc'),
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) =>
        all.push({ id: d.id, ...d.data() } as Application),
      );
    }
    return all;
  }

  async updateApplicationStatus(
    appId: string,
    status: ApplicationStatus,
    notes?: string,
  ): Promise<void> {
    const payload: any = { status, updatedAt: serverTimestamp() };
    if (notes !== undefined) payload.notes = notes;
    await updateDoc(doc(this.firestore, 'applications', appId), payload);
    await this.refreshStats();
  }

  async rateApplication(appId: string, rating: number): Promise<void> {
    await updateDoc(doc(this.firestore, 'applications', appId), {
      rating,
      updatedAt: serverTimestamp(),
    });
  }

  /* ── CANDIDATES (all registered candidates) ── */

  async searchCandidates(filters: {
    sector?: string;
    city?: string;
    experienceYears?: string;
    educationLevel?: string;
    keyword?: string;
  }): Promise<any[]> {
    let q = query(
      collection(this.firestore, 'users'),
      where('role', '==', 'candidate'),
    );

    if (filters.sector) {
      q = query(q, where('sector', '==', filters.sector));
    }

    const snap = await getDocs(q);
    let candidates = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Client-side filters
    if (filters.city) {
      candidates = candidates.filter((c: any) =>
        c.city?.toLowerCase().includes(filters.city!.toLowerCase()),
      );
    }
    if (filters.experienceYears) {
      candidates = candidates.filter(
        (c: any) => c.experienceYears === filters.experienceYears,
      );
    }
    if (filters.educationLevel) {
      candidates = candidates.filter(
        (c: any) => c.educationLevel === filters.educationLevel,
      );
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      candidates = candidates.filter(
        (c: any) =>
          c.firstName?.toLowerCase().includes(kw) ||
          c.lastName?.toLowerCase().includes(kw) ||
          c.title?.toLowerCase().includes(kw) ||
          c.cvData?.summary?.toLowerCase().includes(kw) ||
          c.cvData?.technicalSkills?.some((s: string) =>
            s.toLowerCase().includes(kw),
          ),
      );
    }

    return candidates.filter((c: any) => c.onboardingCompleted !== false);
  }

  /* ── STATS ── */

  async refreshStats(): Promise<void> {
    const uid = this.currentUid;
    if (!uid) return;

    const offers = await this.getMyJobOffers();
    const apps = await this.getAllMyApplications();

    // Calculer les nouvelles offres (créées dans les 7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newOffers = offers.filter((o) => {
      if (!o.createdAt) return false;
      const createdDate = o.createdAt.toDate
        ? o.createdAt.toDate()
        : new Date(o.createdAt);
      return createdDate > sevenDaysAgo;
    }).length;

    this.statsSubject.next({
      totalOffers: offers.length,
      activeOffers: offers.filter((o) => o.status === 'active').length,
      newOffers: newOffers,
      totalApplications: apps.length,
      newApplications: apps.filter((a) => a.status === 'new').length,
      shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
      interviews: apps.filter((a) => a.status === 'interview').length,
    });
  }
  /* ── HELPERS ── */

  readonly sectors = [
    'Technologie & Informatique',
    'Finance & Banque',
    'Commerce & Vente',
    'Santé & Médical',
    'Éducation & Formation',
    'Marketing & Communication',
    'Ressources Humaines',
    'Juridique',
    'BTP & Architecture',
    'Industrie & Production',
    'Logistique & Transport',
    'Agriculture & Agroalimentaire',
    'Tourisme & Hôtellerie',
    'Médias & Création',
    'Télécom',
    'Administration & Gestion',
    'Autre',
  ];

  readonly jobTypes: JobType[] = [
    'CDI',
    'CDD',
    'Stage',
    'Freelance',
    'Alternance',
    'Temps partiel',
  ];

  readonly experienceLevels: ExperienceLevel[] = [
    'Junior (0-2 ans)',
    'Confirmé (3-5 ans)',
    'Senior (5-10 ans)',
    'Expert (10+ ans)',
  ];

  readonly educationLevels = [
    'Bac',
    'Bac+2 (BTS/DUT)',
    'Bac+3 (Licence)',
    'Bac+4 (Master 1)',
    'Bac+5 (Master/Ingénieur)',
    'Doctorat',
    'Sans diplôme requis',
  ];

  readonly remoteOptions = [
    { value: 'onsite', label: 'Présentiel' },
    { value: 'hybrid', label: 'Hybride' },
    { value: 'full-remote', label: 'Full Remote' },
  ];

  readonly appStatusConfig: Record<
    ApplicationStatus,
    { label: string; color: string; bg: string }
  > = {
    new: { label: 'Nouvelle', color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
    viewed: {
      label: 'Consultée',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,.15)',
    },
    shortlisted: {
      label: 'Sélectionné',
      color: '#00D68F',
      bg: 'rgba(0,214,143,.15)',
    },
    interview: {
      label: 'Entretien',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,.15)',
    },
    offer: {
      label: 'Offre envoyée',
      color: '#10b981',
      bg: 'rgba(16,185,129,.15)',
    },
    rejected: {
      label: 'Non retenu',
      color: '#ef4444',
      bg: 'rgba(239,68,68,.15)',
    },
  };
  formatSalary(min?: number, max?: number, currency: string = 'XOF'): string {
    if (!min && !max) return 'Non spécifié';

    const format = (value: number) =>
      new Intl.NumberFormat('fr-FR').format(value);

    if (min && max) return `${format(min)} - ${format(max)} ${currency}`;
    if (min) return `À partir de ${format(min)} ${currency}`;
    if (max) return `Jusqu'à ${format(max)} ${currency}`;

    return '';
  }
}
