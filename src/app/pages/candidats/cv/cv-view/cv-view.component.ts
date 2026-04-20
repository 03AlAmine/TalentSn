import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, UserData, CvData } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cv-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-view.component.html',
  styleUrls: ['./cv-view.component.css']
})
export class CvViewComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  cvData: CvData | null = null;
  isLoading = true;
  isSharedView = false;
  isSaving = false;
  isExporting = false;
  isUploadingPhoto = false;
  shareLink = '';
  showShareToast = false;
  showSaveToast = false;
  hasPendingChanges = false;

  showTechSkillInput = false;
  showSoftSkillInput = false;
  newTechSkill = '';
  newSoftSkill = '';

  templates = [
    { id: 'executive', label: 'Executive', headerBg: '#1a1a2e' },
    { id: 'sidebar',   label: 'Sidebar',   headerBg: '#1E2A3A' },
    { id: 'minimal',   label: 'Minimal',   headerBg: '#0f172a' },
  ];

  accentColors = [
    { id: 'slate',    label: 'Ardoise',    value: '#1E2A3A' },
    { id: 'navy',     label: 'Marine',     value: '#1d4ed8' },
    { id: 'teal',     label: 'Sarcelle',   value: '#0d9488' },
    { id: 'forest',   label: 'Forêt',      value: '#15803d' },
    { id: 'burgundy', label: 'Bordeaux',   value: '#9f1239' },
    { id: 'plum',     label: 'Prune',      value: '#6d28d9' },
    { id: 'copper',   label: 'Cuivre',     value: '#b45309' },
    { id: 'charcoal', label: 'Anthracite', value: '#374151' },
  ];

  private sub!: Subscription;
  private saveTimer: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (uid) {
      this.isSharedView = true;
      this.loadSharedCV(uid);
    } else {
      this.sub = this.authService.userData$.subscribe(data => {
        this.userData = data;
        this.cvData = data?.cvData ? { ...data.cvData } : null;
        this.isLoading = false;
        if (this.cvData) {
          if (!this.cvData.template) this.cvData.template = 'executive';
          if (!this.cvData.accentColor) this.cvData.accentColor = '#1d4ed8';
          this.shareLink = `${window.location.origin}/cv/${data?.uid}`;
          this.applyAccentColor(this.cvData.accentColor);
        }
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }

  async loadSharedCV(uid: string) {
    try {
      const data = await this.authService.getUserData(uid);
      this.userData = data;
      this.cvData = data?.cvData ? { ...data.cvData } : null;
      if (this.cvData?.accentColor) this.applyAccentColor(this.cvData.accentColor);
    } catch (e) { console.error(e); }
    finally { this.isLoading = false; }
  }

  applyAccentColor(color: string) {
    document.documentElement.style.setProperty('--cv-accent', color);
  }

  get currentAccentColor(): string { return this.cvData?.accentColor || '#1d4ed8'; }
  get fullName(): string { return `${this.userData?.firstName || ''} ${this.userData?.lastName || ''}`.trim(); }
  get location(): string { return [this.userData?.city, this.userData?.country].filter(Boolean).join(', '); }
  get linkedinUrl(): string { return this.cvData?.additionalInfo?.linkedin || ''; }
  get githubUrl(): string { return this.cvData?.additionalInfo?.github || ''; }
  get linkedinHandle(): string {
    const m = this.linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    return m ? m[1] : this.linkedinUrl;
  }
  get githubHandle(): string {
    const m = this.githubUrl.match(/github\.com\/([^\/\?]+)/);
    return m ? m[1] : this.githubUrl;
  }

  // ─── INLINE EDIT CORE ──────────────────────────────────────────────

  onFieldBlur(event: Event, path: string, index?: number, subPath?: string) {
    if (this.isSharedView) return;
    const val = (event.target as HTMLElement).innerText.trim();
    if (path === 'summary') {
      this.cvData = { ...this.cvData!, summary: val };
    } else if (path === 'experiences' && index !== undefined && subPath) {
      const exps = this.cvData!.experiences.map((e: any, i: number) =>
        i === index ? { ...e, [subPath]: val } : e);
      this.cvData = { ...this.cvData!, experiences: exps };
    } else if (path === 'educations' && index !== undefined && subPath) {
      const edus = this.cvData!.educations.map((e: any, i: number) =>
        i === index ? { ...e, [subPath]: val } : e);
      this.cvData = { ...this.cvData!, educations: edus };
    } else if (path === 'userData' && subPath) {
      this.userData = { ...this.userData!, [subPath]: val };
    }
    this.scheduleSave();
  }

  onBulletBlur(event: Event, expIndex: number, bulletIndex: number) {
    if (this.isSharedView) return;
    const val = (event.target as HTMLElement).innerText.trim();
    const exps = this.cvData!.experiences.map((e: any, i: number) => {
      if (i !== expIndex) return e;
      const bullets = e.bulletPoints.map((b: string, j: number) => j === bulletIndex ? val : b);
      return { ...e, bulletPoints: bullets };
    });
    this.cvData = { ...this.cvData!, experiences: exps };
    this.scheduleSave();
  }

  removeBullet(expIndex: number, bulletIndex: number) {
    const exps = this.cvData!.experiences.map((e: any, i: number) => {
      if (i !== expIndex) return e;
      return { ...e, bulletPoints: e.bulletPoints.filter((_: string, j: number) => j !== bulletIndex) };
    });
    this.cvData = { ...this.cvData!, experiences: exps };
    this.scheduleSave();
  }

  addBullet(expIndex: number) {
    const exps = this.cvData!.experiences.map((e: any, i: number) => {
      if (i !== expIndex) return e;
      return { ...e, bulletPoints: [...(e.bulletPoints || []), 'Nouvelle réalisation…'] };
    });
    this.cvData = { ...this.cvData!, experiences: exps };
    this.scheduleSave();
  }

  // ─── SKILLS ────────────────────────────────────────────────────────

  addTechSkill() {
    const v = this.newTechSkill.trim();
    if (!v) return;
    this.cvData = { ...this.cvData!, technicalSkills: [...(this.cvData!.technicalSkills || []), v] };
    this.newTechSkill = '';
    this.showTechSkillInput = false;
    this.scheduleSave();
  }

  removeTechSkill(i: number) {
    this.cvData = { ...this.cvData!, technicalSkills: this.cvData!.technicalSkills.filter((_: string, j: number) => j !== i) };
    this.scheduleSave();
  }

  addSoftSkill() {
    const v = this.newSoftSkill.trim();
    if (!v) return;
    this.cvData = { ...this.cvData!, softSkills: [...(this.cvData!.softSkills || []), v] };
    this.newSoftSkill = '';
    this.showSoftSkillInput = false;
    this.scheduleSave();
  }

  removeSoftSkill(i: number) {
    this.cvData = { ...this.cvData!, softSkills: this.cvData!.softSkills.filter((_: string, j: number) => j !== i) };
    this.scheduleSave();
  }

  // ─── AUTO-SAVE ─────────────────────────────────────────────────────

  scheduleSave() {
    this.hasPendingChanges = true;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persistChanges(), 1200);
  }

  async persistChanges() {
    if (!this.cvData || this.isSharedView) return;
    this.isSaving = true;
    this.cdr.detectChanges();
    try {
      const user = this.authService.getCurrentUser();
      if (user) {
        await this.authService.saveCvData(user.uid, this.cvData);
        this.hasPendingChanges = false;
        this.showSaveToast = true;
        setTimeout(() => { this.showSaveToast = false; this.cdr.detectChanges(); }, 2500);
      }
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  // ─── TEMPLATE / COLOR ──────────────────────────────────────────────

  async changeTemplate(id: string) {
    if (!this.cvData || this.isSharedView) return;
    this.cvData = { ...this.cvData, template: id };
    const user = this.authService.getCurrentUser();
    if (user) await this.authService.saveCvData(user.uid, this.cvData);
  }

  async changeAccentColor(color: string) {
    if (!this.cvData || this.isSharedView) return;
    this.cvData = { ...this.cvData, accentColor: color };
    this.applyAccentColor(color);
    const user = this.authService.getCurrentUser();
    if (user) await this.authService.saveCvData(user.uid, this.cvData);
  }

  // ─── MISC ──────────────────────────────────────────────────────────

  onSingleLineKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); }
  }

  async exportPdf() {
    this.isExporting = true;
    try { window.print(); }
    finally { setTimeout(() => this.isExporting = false, 1000); }
  }

  async copyShareLink() {
    try {
      await navigator.clipboard.writeText(this.shareLink);
      this.showShareToast = true;
      setTimeout(() => this.showShareToast = false, 3000);
    } catch (e) { console.error(e); }
  }

  triggerPhotoUpload() {
    if (this.isSharedView) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e: any) => {
      const file: File = e.target.files?.[0];
      if (!file) return;
      const user = this.authService.getCurrentUser();
      if (!user) return;
      this.isUploadingPhoto = true;
      try { await this.authService.uploadProfilePhoto(user.uid, file); }
      catch (err) { console.error(err); }
      finally { this.isUploadingPhoto = false; this.cdr.detectChanges(); }
    };
    input.click();
  }

  goBack() { this.router.navigate(['/candidate/dashboard']); }
}
