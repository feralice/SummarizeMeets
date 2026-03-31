import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css'],
})
export class FileUploaderComponent {
  files: File[] = [];
  error: string | null = null;

  @Input() isProcessing = false;
  @Output() fileSelected = new EventEmitter<File[]>();
  @Output() generateSummary = new EventEmitter<void>();

  private readonly MAX_SIZE_MB = 2048;
  private readonly MAX_FILES = 5;

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.appendFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    if (this.isProcessing || !event.dataTransfer?.files?.length) return;
    this.appendFiles(Array.from(event.dataTransfer.files));
  }

  removeFileAt(index: number) {
    this.files = this.files.filter((_, i) => i !== index);
    this.fileSelected.emit(this.files);
  }

  removeFile() {
    this.files = [];
    this.error = null;
    this.fileSelected.emit(this.files);
  }

  private appendFiles(incoming: File[]) {
    this.error = null;

    for (const file of incoming) {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      if (!isVideo && !isAudio) {
        this.error = `"${file.name}" nÃ£o Ã© um arquivo de vÃ­deo ou Ã¡udio.`;
        return;
      }

      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > this.MAX_SIZE_MB) {
        this.error = `"${file.name}" excede o limite de 2GB.`;
        return;
      }
    }

    const combined = [...this.files, ...incoming];
    if (combined.length > this.MAX_FILES) {
      this.error = `MÃ¡ximo de ${this.MAX_FILES} arquivos por vez.`;
      return;
    }

    this.files = combined;
    this.fileSelected.emit(this.files);
  }
}
