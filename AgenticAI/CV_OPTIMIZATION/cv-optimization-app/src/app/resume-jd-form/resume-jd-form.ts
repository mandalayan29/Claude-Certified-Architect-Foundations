import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type InputMode = 'file' | 'text';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-resume-jd-form',
  styleUrl: './resume-jd-form.css',
  templateUrl: './resume-jd-form.html',
})
export class ResumeJdForm {

  inputMode = signal<InputMode>('file');

  // Form states
  selectedFile = signal<File | null>(null);
  resumeText = signal<string>('');
  jobDescription = signal<string>('');
  isDragging = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  // Allowed file extensions
  readonly allowedExtensions = ['.pdf', '.docx', '.txt'];
  readonly maxFileSizeMB = 5;

  // Computed validity
  canSubmit = computed(() => {
    const hasResume = this.inputMode() === 'file' 
      ? this.selectedFile() !== null 
      : this.resumeText().trim().length > 30;
    const hasJD = this.jobDescription().trim().length > 20;
    return hasResume && hasJD && !this.isSubmitting();
  });

  // JD word counter
  jdWordCount = computed(() => {
    const text = this.jobDescription().trim();
    return text ? text.split(/\s+/).length : 0;
  });

  setMode(mode: InputMode) {
    this.inputMode.set(mode);
    this.errorMessage.set(null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  private validateAndSetFile(file: File) {
    this.errorMessage.set(null);
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!this.allowedExtensions.includes(extension)) {
      this.errorMessage.set('Invalid format. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    if (file.size > this.maxFileSizeMB * 1024 * 1024) {
      this.errorMessage.set(`File size exceeds limit (${this.maxFileSizeMB} MB).`);
      return;
    }

    this.selectedFile.set(file);
  }

  removeFile() {
    this.selectedFile.set(null);
    this.errorMessage.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  handleSubmit() {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    const payload = {
      mode: this.inputMode(),
      resumeFile: this.selectedFile(),
      resumeText: this.resumeText(),
      jobDescription: this.jobDescription()
    };

    console.log('Dispatching ATS Optimization payload:', payload);

    // Simulate async API call
    setTimeout(() => {
      this.isSubmitting.set(false);
      // alert('Resume submitted successfully for ATS optimization!');
    }, 2000);
  }

}
