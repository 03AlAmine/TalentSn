import { Injectable, inject } from '@angular/core';
import {
  Auth,
  user,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface CvData {
  generatedAt: any;
  theme: string;
  template?: string;
  accentColor: string;
  summary: string;
  experiences: any[];
  educations: any[];
  technicalSkills: string[];
  softSkills: string[];
  languages: any[];
  certifications: any[];
  additionalInfo: any;
  shareToken?: string;
}

export interface UserData {
  department: string;
  bio: string;
  uid: string;
  email: string;
  role: 'candidate' | 'recruiter';
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  photoURL?: string;
  createdAt: any;
  title?: string;
  educationLevel?: string;
  experienceYears?: string;
  sector?: string;
  onboardingCompleted?: boolean;
  cvData?: CvData;
  companyName?: string;
  companySector?: string;
  employeeCount?: string;
  ninea?: string;
  website?: string;
  position?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  refreshUserData() {
    throw new Error('Method not implemented.');
  }
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private router = inject(Router);

  public authUser$ = user(this.auth);

  public userData$: Observable<UserData | null> = this.authUser$.pipe(
    switchMap((u) => {
      if (!u) return of(null);
      return docData(
        doc(this.firestore, 'users', u.uid),
      ) as Observable<UserData | null>;
    }),
  );

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  public legacyUserData$ = this.userDataSubject.asObservable();

  constructor() {
    this.authUser$.subscribe((u) => this.currentUserSubject.next(u));
    this.userData$.subscribe((ud) => this.userDataSubject.next(ud));
  }

  async registerCandidate(data: any): Promise<any> {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password,
    );
    await updateProfile(cred.user, {
      displayName: `${data.firstName} ${data.lastName}`,
    });
    const userData: UserData = {
      uid: cred.user.uid,
      email: data.email,
      role: 'candidate',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || '',
      city: data.city || '',
      country: data.country || '',
      dateOfBirth: data.dateOfBirth || '',
      placeOfBirth: data.placeOfBirth || '',
      title: data.title || '',
      educationLevel: data.educationLevel || '',
      experienceYears: data.experienceYears || '',
      sector: data.sector || '',
      createdAt: new Date(),
      onboardingCompleted: false,
      department: '',
      bio: '',
    };
    await setDoc(doc(this.firestore, 'users', cred.user.uid), userData);
    return cred.user;
  }

  async registerRecruiter(data: any): Promise<any> {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password,
    );
    await updateProfile(cred.user, {
      displayName: `${data.firstName} ${data.lastName}`,
    });
    const userData: UserData = {
      uid: cred.user.uid,
      email: data.email,
      role: 'recruiter',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || '',
      city: data.city || '',
      country: data.country || '',
      position: data.position || '',
      companyName: data.companyName || '',
      companySector: data.companySector || '',
      employeeCount: data.employeeCount || '',
      website: data.website || '',
      ninea: data.ninea || '',
      createdAt: new Date(),
      department: '',
      bio: '',
    };
    await setDoc(doc(this.firestore, 'users', cred.user.uid), userData);
    return cred.user;
  }

  async login(email: string, password: string): Promise<any> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  async loginWithGoogle(): Promise<any> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    const u = cred.user;
    const snap = await getDoc(doc(this.firestore, 'users', u.uid));
    if (!snap.exists()) {
      const userData: UserData = {
        uid: u.uid,
        email: u.email!,
        role: 'candidate',
        firstName: u.displayName?.split(' ')[0] || '',
        lastName: u.displayName?.split(' ').slice(1).join(' ') || '',
        photoURL: u.photoURL || '',
        createdAt: new Date(),
        onboardingCompleted: false,
        department: '',
        bio: '',
      };
      await setDoc(doc(this.firestore, 'users', u.uid), userData);
    }
    return u;
  }

  async uploadProfilePhoto(uid: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, `profile-photos/${uid}/photo.jpg`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(this.firestore, 'users', uid), { photoURL: url });
    return url;
  }

  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const snap = await getDoc(doc(this.firestore, 'users', uid));
      return snap.exists() ? (snap.data() as UserData) : null;
    } catch {
      return null;
    }
  }

  async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), data as any);
  }

  async saveCvData(uid: string, cvData: CvData): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), { cvData } as any);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  async getCurrentUserRole(): Promise<'candidate' | 'recruiter' | null> {
    const u = this.auth.currentUser;
    if (!u) return null;
    const ud = await this.getUserData(u.uid);
    return ud?.role || null;
  }

  async redirectAfterLogin(): Promise<void> {
    const u = this.auth.currentUser;
    if (!u) return;
    const ud = await this.getUserData(u.uid);
    if (ud?.role === 'candidate')
      this.router.navigate(['/candidate/dashboard']);
    else if (ud?.role === 'recruiter')
      this.router.navigate(['/recruiter/dashboard']);
    else this.router.navigate(['/onboarding']);
  }

}
