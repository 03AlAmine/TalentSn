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
  User
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  getDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

export interface UserData {
  uid: string;
  email: string;
  role: 'candidate' | 'recruiter';
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  country?: string;
  createdAt: Date;
  title?: string;
  educationLevel?: string;
  experienceYears?: string;
  sector?: string;
  companyName?: string;
  companySector?: string;
  employeeCount?: string;
  ninea?: string;
  website?: string;
  position?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Observable Firebase natif pour l'utilisateur (gère automatiquement les changements)
  public authUser$ = user(this.auth);

  // Observable des données utilisateur depuis Firestore
  public userData$: Observable<UserData | null> = this.authUser$.pipe(
    switchMap(user => {
      if (!user) return of(null);
      const userDocRef = doc(this.firestore, 'users', user.uid);
      return docData(userDocRef) as Observable<UserData | null>;
    })
  );

  // Pour garder la compatibilité avec ton code existant
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  public legacyUserData$ = this.userDataSubject.asObservable();

  constructor() {
    // S'abonner à l'observable Firebase pour maintenir la compatibilité
    this.authUser$.subscribe(user => {
      this.currentUserSubject.next(user);
    });

    // S'abonner aux données utilisateur
    this.userData$.subscribe(userData => {
      this.userDataSubject.next(userData);
    });
  }

  async registerCandidate(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    country: string;
    title: string;
    educationLevel: string;
    experienceYears: string;
    sector: string;
  }): Promise<any> {
    // 1. Créer l'utilisateur dans Auth
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password
    );

    // 2. Mettre à jour le profil
    await updateProfile(userCredential.user, {
      displayName: `${data.firstName} ${data.lastName}`
    });

    // 3. Créer le document dans Firestore
    const userData: UserData = {
      uid: userCredential.user.uid,
      email: data.email,
      role: 'candidate',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      city: data.city,
      country: data.country,
      title: data.title,
      educationLevel: data.educationLevel,
      experienceYears: data.experienceYears,
      sector: data.sector,
      createdAt: new Date()
    };

    await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userData);

    return userCredential.user;
  }

  async registerRecruiter(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    position: string;
    companyName: string;
    companySector: string;
    employeeCount: string;
    city: string;
    country: string;
    website: string;
    ninea: string;
  }): Promise<any> {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password
    );

    await updateProfile(userCredential.user, {
      displayName: `${data.firstName} ${data.lastName}`
    });

    const userData: UserData = {
      uid: userCredential.user.uid,
      email: data.email,
      role: 'recruiter',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      city: data.city,
      country: data.country,
      position: data.position,
      companyName: data.companyName,
      companySector: data.companySector,
      employeeCount: data.employeeCount,
      website: data.website,
      ninea: data.ninea,
      createdAt: new Date()
    };

    await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userData);

    return userCredential.user;
  }

  async login(email: string, password: string): Promise<any> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  async loginWithGoogle(): Promise<any> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(this.auth, provider);
    const user = userCredential.user;

    // Vérifier si l'utilisateur existe dans Firestore
    const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));

    if (!userDoc.exists()) {
      // Créer un profil par défaut pour les nouveaux utilisateurs Google
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        role: 'candidate',
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        createdAt: new Date()
      };
      await setDoc(doc(this.firestore, 'users', user.uid), userData);
    }

    return user;
  }

  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as UserData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), data);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }

  getCurrentUser(): any | null {
    return this.auth.currentUser;
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  // Méthode utilitaire pour obtenir le rôle de l'utilisateur courant
  async getCurrentUserRole(): Promise<'candidate' | 'recruiter' | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    const userData = await this.getUserData(user.uid);
    return userData?.role || null;
  }

  // Redirection basée sur le rôle après connexion
  async redirectAfterLogin(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const userData = await this.getUserData(user.uid);
    if (userData?.role === 'candidate') {
      this.router.navigate(['/candidate/dashboard']);
    } else if (userData?.role === 'recruiter') {
      this.router.navigate(['/recruiter/dashboard']);
    } else {
      this.router.navigate(['/onboarding']);
    }
  }
}
