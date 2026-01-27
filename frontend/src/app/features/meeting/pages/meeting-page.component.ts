import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../../core/services/send-video.service';
import { FileUploaderComponent } from '../components/file-uploader/file-uploader.component';
import { ProcessingIndicatorComponent } from '../../../shared/components/processing-indicator/processing-indicator.component';

@Component({
  selector: 'app-meeting-page',
  standalone: true,
  imports: [CommonModule, FileUploaderComponent, ProcessingIndicatorComponent],
  templateUrl: './meeting-page.component.html',
  styleUrls: ['./meeting-page.component.css'],
})
export class MeetingPageComponent {
  selectedFile: File | null = null;

  showProcessing = false;
  progress = 0;
  currentStage = '';
  analysisResult: string | null = null;
  error: string | null = null;

  constructor(private videoService: VideoService) {}

  onFileSelected(file: File) {
    this.selectedFile = file;
  }

  onGenerateSummary() {
    if (!this.selectedFile) return;

    this.showProcessing = true;
    this.progress = 10;
    this.currentStage = 'Enviando arquivo...';

    this.videoService.analyzeVideo(this.selectedFile).subscribe({
      next: (res) => {
        this.progress = 100;
        this.analysisResult = res?.summary || 'Resumo gerado com sucesso';
        this.showProcessing = false;
      },
      error: (err) => {
        this.error = err.message || 'Erro ao processar vídeo';
        this.showProcessing = false;
      },
    });
  }
}
