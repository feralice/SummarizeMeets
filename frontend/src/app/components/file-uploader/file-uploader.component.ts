import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css'],
})
export class FileUploaderComponent {
  @Input() isProcessing: boolean = false;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() generateSummary = new EventEmitter<void>();

  isDragging = false;
  selectedFile: File | null = null;

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
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    const maxSize = 2 * 1024 * 1024 * 1024;
    const allowedTypes = ['video/', 'audio/'];

    if (file.size > maxSize) {
      alert('Arquivo muito grande. Tamanho máximo: 2GB');
      return;
    }

    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      alert('Tipo de arquivo não suportado. Use vídeo ou áudio.');
      return;
    }

    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  removeFile() {
    this.selectedFile = null;
    this.fileRemoved.emit();
  }

  onGenerateSummary() {
    if (this.selectedFile && !this.isProcessing) {
      this.generateSummary.emit();
    }
  }

  reset() {
    this.selectedFile = null;
  }
}
