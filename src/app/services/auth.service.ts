import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

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
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  public userData$ = this.userDataSubject.asObservable();

  constructor() {
    this.auth.onAuthStateChanged(async (user) => {
      this.currentUserSubject.next(user);
      if (user) {
        try {
          const userData = await this.getUserData(user.uid);
          this.userDataSubject.next(userData);
        } catch (error) {
          console.error('Error getting user data:', error);
        }
      } else {
        this.userDataSubject.next(null);
      }
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
  }): Promise<User> {
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
    
    // Attendre que Firestore soit prêt
    await this.ensureFirestoreConnection();
    
    await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userData);
    this.userDataSubject.next(userData);
    
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
  }): Promise<User> {
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
    
    await this.ensureFirestoreConnection();
    await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userData);
    this.userDataSubject.next(userData);
    
    return userCredential.user;
  }

  private async ensureFirestoreConnection(): Promise<void> {
    // Petit délai pour s'assurer que Firestore est prêt
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    await this.ensureFirestoreConnection();
    const userData = await this.getUserData(userCredential.user.uid);
    this.userDataSubject.next(userData);
    return userCredential.user;
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(this.auth, provider);
    const user = userCredential.user;
    
    await this.ensureFirestoreConnection();
    const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
    
    if (!userDoc.exists()) {
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        role: 'candidate',
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        createdAt: new Date()
      };
      await setDoc(doc(this.firestore, 'users', user.uid), userData);
      this.userDataSubject.next(userData);
    } else {
      this.userDataSubject.next(userDoc.data() as UserData);
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
    const updated = await this.getUserData(uid);
    this.userDataSubject.next(updated);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.userDataSubject.next(null);
    this.router.navigate(['/']);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }
}
