import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../../core/services/send-video.service';
import { FileUploaderComponent } from '../components/file-uploader/file-uploader.component';
import { ProcessingIndicatorComponent } from '../components/processing-indicator/processing-indicator.component';
import { MeetingResultComponent } from '../components/meeting-result/meeting-result.component';
import { MeetingAnalysis } from '../../../core/models/meeting-analysis.model';

@Component({
  selector: 'app-meeting-page',
  standalone: true,
  imports: [
    CommonModule,
    FileUploaderComponent,
    ProcessingIndicatorComponent,
    MeetingResultComponent,
  ],
  templateUrl: './meeting-page.component.html',
  styleUrls: ['./meeting-page.component.css'],
})
export class MeetingPageComponent {
  selectedFile: File | null = null;

  showProcessing = false;
  progress = 0;
  currentStage = '';
  analysisResult: MeetingAnalysis | null = null;
  error: string | null = null;
  showResultModal = false;

  constructor(private videoService: VideoService) {}

  onFileSelected(file: File) {
    this.selectedFile = file;
  }

  closeModal(): void {
    this.showResultModal = false;
  }

  onGenerateSummary() {
    if (!this.selectedFile) return;

    this.error = null;
    this.analysisResult = null;

    this.showProcessing = true;
    this.currentStage = 'Enviando arquivo...';

    this.videoService.analyzeVideo(this.selectedFile).subscribe({
      next: (res) => {
        this.analysisResult = res;
        this.showProcessing = false;
        this.showResultModal = true;
      },
      error: (err) => {
        this.error = err.message;
        this.showProcessing = false;
      },
    });
  }
}
