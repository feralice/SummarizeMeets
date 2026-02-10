import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css'],
})
export class FileUploaderComponent {
  file: File | null = null;
  error: string | null = null;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() generateSummary = new EventEmitter<void>();

  private readonly MAX_SIZE_MB = 2048; // 2GB

  onFileChange(event: Event) {
    this.error = null;

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if (!isVideo && !isAudio) {
      this.error = 'Por favor, selecione um arquivo de vídeo ou áudio.';
      return;
    }

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > this.MAX_SIZE_MB) {
      this.error = 'O arquivo deve ter no máximo 2GB.';
      return;
    }

    this.file = file;
    this.fileSelected.emit(file);
  }

  removeFile() {
    this.file = null;
    this.error = null;
  }
}
