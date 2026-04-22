// cv-upload.component.ts (REFACTORISÉ - simplifié)
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CvParserService, ExtractedProfile, ParseProgress } from '../../../../core/services/cv-parser.service';

@Component({
  selector: 'app-cv-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-upload.component.html',
  styleUrls: ['./cv-upload.component.css']
})
export class CvUploadComponent {
  @Output() profileExtracted = new EventEmitter<ExtractedProfile>();
  @Output() skip = new EventEmitter<void>();

  isDragging = false;
  isProcessing = false;
  isDone = false;
  isError = false;

  progress = { stage: 'reading', progress: 0, message: '' };
  extractedProfile: ExtractedProfile | null = null;
  fileName = '';
  errorMessage = '';

  constructor(
    private cvParser: CvParserService,
    private router: Router
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files?.length) this.processFile(files[0]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.processFile(input.files[0]);
  }

  private async processFile(file: File) {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      this.errorMessage = 'Format non supporté. Utilisez PDF, JPG ou PNG.';
      this.isError = true;
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Fichier trop volumineux (max 10 Mo).';
      this.isError = true;
      return;
    }

    this.fileName = file.name;
    this.isProcessing = true;
    this.isError = false;

    try {
      const profile = await this.cvParser.parseFile(file, (progress) => {
        this.progress = progress;
      });
      this.extractedProfile = profile;
      this.isProcessing = false;
      this.isDone = true;
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'analyse du document.';
      this.isError = true;
      this.isProcessing = false;
    }
  }

  confirmProfile() {
    if (this.extractedProfile) {
      this.profileExtracted.emit(this.extractedProfile);
    }
  }

  retry() {
    this.isError = false;
    this.isDone = false;
    this.extractedProfile = null;
    this.fileName = '';
    this.progress = { stage: 'reading', progress: 0, message: '' };
  }

  skipUpload() {
    this.skip.emit();
  }

  goBack() {
    this.router.navigate(['/candidate/cv']);
  }

  getConfidenceLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Correct';
    return 'Partiel';
  }
}
