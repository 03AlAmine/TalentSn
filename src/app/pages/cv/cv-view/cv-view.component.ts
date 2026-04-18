import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, UserData, CvData } from '../../../services/auth.service';
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
  isEditing = false;
  isSaving = false;
  isExporting = false;
  isUploadingPhoto = false;
  shareLink = '';
  showShareToast = false;
  showSaveToast = false;

  themes = [
    { id: 'green',  label: 'Vert TalentSn',   color: '#00D68F' },
    { id: 'blue',   label: 'Bleu Pro',         color: '#3B82F6' },
    { id: 'purple', label: 'Violet Créatif',   color: '#8B5CF6' },
    { id: 'dark',   label: 'Dark Élégant',     color: '#1e1e3a' },
    { id: 'orange', label: 'Orange Énergie',   color: '#f97316' },
    { id: 'red',    label: 'Rouge Impact',     color: '#ef4444' },
  ];

  // Edit state
  editSummary = '';
  editTechSkills: string[] = [];
  editSoftSkills: string[] = [];
  newTechSkill = '';
  newSoftSkill = '';

  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (uid) {
      this.isSharedView = true;
      this.loadSharedCV(uid);
    } else {
      this.sub = this.authService.userData$.subscribe(data => {
        this.userData = data;
        this.cvData = data?.cvData || null;
        this.isLoading = false;
        if (this.cvData) {
          this.editSummary = this.cvData.summary || '';
          this.editTechSkills = [...(this.cvData.technicalSkills || [])];
          this.editSoftSkills = [...(this.cvData.softSkills || [])];
          this.shareLink = `${window.location.origin}/cv/${data?.uid}`;
        }
      });
    }
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  async loadSharedCV(uid: string) {
    try {
      const data = await this.authService.getUserData(uid);
      this.userData = data;
      this.cvData = data?.cvData || null;
    } catch (e) { console.error(e); }
    finally { this.isLoading = false; }
  }

  get themeColor(): string {
    return this.themes.find(t => t.id === this.cvData?.theme)?.color || '#00D68F';
  }

  get fullName(): string {
    return `${this.userData?.firstName || ''} ${this.userData?.lastName || ''}`.trim();
  }

  get location(): string {
    const c = this.userData?.city || '';
    const co = this.userData?.country || '';
    return [c, co].filter(Boolean).join(', ');
  }

  get linkedinUrl(): string {
    return this.cvData?.additionalInfo?.linkedin || '';
  }

  get githubUrl(): string {
    return this.cvData?.additionalInfo?.github || '';
  }

  get linkedinHandle(): string {
    const url = this.linkedinUrl;
    if (!url) return '';
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    return match ? match[1] : url;
  }

  get githubHandle(): string {
    const url = this.githubUrl;
    if (!url) return '';
    const match = url.match(/github\.com\/([^\/\?]+)/);
    return match ? match[1] : url;
  }

  async changeTheme(themeId: string) {
    if (!this.cvData || this.isSharedView) return;
    this.cvData = { ...this.cvData, theme: themeId };
    const user = this.authService.getCurrentUser();
    if (user) await this.authService.saveCvData(user.uid, this.cvData);
  }

  toggleEdit() {
    if (this.isEditing) {
      this.editSummary = this.cvData?.summary || '';
      this.editTechSkills = [...(this.cvData?.technicalSkills || [])];
      this.editSoftSkills = [...(this.cvData?.softSkills || [])];
    }
    this.isEditing = !this.isEditing;
  }

  addTechSkill() {
    if (this.newTechSkill.trim() && !this.editTechSkills.includes(this.newTechSkill.trim())) {
      this.editTechSkills.push(this.newTechSkill.trim());
      this.newTechSkill = '';
    }
  }

  removeTechSkill(i: number) { this.editTechSkills.splice(i, 1); }

  addSoftSkill() {
    if (this.newSoftSkill.trim() && !this.editSoftSkills.includes(this.newSoftSkill.trim())) {
      this.editSoftSkills.push(this.newSoftSkill.trim());
      this.newSoftSkill = '';
    }
  }

  removeSoftSkill(i: number) { this.editSoftSkills.splice(i, 1); }

  async saveChanges() {
    if (!this.cvData) return;
    this.isSaving = true;
    try {
      const updated: CvData = {
        ...this.cvData,
        summary: this.editSummary,
        technicalSkills: [...this.editTechSkills],
        softSkills: [...this.editSoftSkills],
      };
      const user = this.authService.getCurrentUser();
      if (user) {
        await this.authService.saveCvData(user.uid, updated);
        this.cvData = updated;
        this.isEditing = false;
        this.showSaveToast = true;
        setTimeout(() => this.showSaveToast = false, 3000);
      }
    } finally { this.isSaving = false; }
  }

  async exportPdf() {
    this.isExporting = true;
    try {
      const el = document.getElementById('cv-to-print');
      if (!el) return;
      window.print();
    } finally {
      setTimeout(() => this.isExporting = false, 1000);
    }
  }

  async copyShareLink() {
    try {
      await navigator.clipboard.writeText(this.shareLink);
      this.showShareToast = true;
      setTimeout(() => this.showShareToast = false, 3000);
    } catch (e) { console.error(e); }
  }

  // ── UPLOAD PHOTO depuis le CV
  triggerPhotoUpload() {
    if (this.isSharedView) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e: any) => {
      const file: File = e.target.files?.[0];
      if (!file) return;
      const user = this.authService.getCurrentUser();
      if (!user) return;
      this.isUploadingPhoto = true;
      try {
        await this.authService.uploadProfilePhoto(user.uid, file);
      } catch (err) { console.error(err); }
      finally { this.isUploadingPhoto = false; }
    };
    input.click();
  }

  goBack() { this.router.navigate(['/candidate/dashboard']); }
}