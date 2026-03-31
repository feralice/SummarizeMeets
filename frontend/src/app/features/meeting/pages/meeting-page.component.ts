import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VideoService } from '../../../core/services/media-analysis.service';
import { QueueStateService } from '../../../core/services/queue-state.service';
import { FileUploaderComponent } from '../components/file-uploader/file-uploader.component';
import { QueueListComponent } from '../components/queue-list/queue-list.component';

@Component({
  selector: 'app-meeting-page',
  standalone: true,
  imports: [CommonModule, FileUploaderComponent, QueueListComponent],
  templateUrl: './meeting-page.component.html',
  styleUrls: ['./meeting-page.component.css'],
})
export class MeetingPageComponent {
  @ViewChild(FileUploaderComponent) uploaderRef!: FileUploaderComponent;

  selectedFiles: File[] = [];
  error: string | null = null;
  backgroundMessage: string | null = null;
  isSubmitting = false;

  private mediaService = inject(VideoService);
  private queueState = inject(QueueStateService);
  private router = inject(Router);

  get queue() {
    return this.queueState.queue();
  }

  onFileSelected(files: File[]) {
    this.selectedFiles = files;
  }

  onGenerateSummary() {
    if (!this.selectedFiles.length || this.isSubmitting) return;

    const files = [...this.selectedFiles];
    this.error = null;
    this.backgroundMessage = null;
    this.isSubmitting = true;

    let remaining = files.length;
    let queuedCount = 0;
    const errors: string[] = [];

    const onDone = () => {
      remaining -= 1;
      if (remaining > 0) return;

      this.isSubmitting = false;
      this.uploaderRef.removeFile();
      this.selectedFiles = [];

      if (queuedCount > 0) {
        this.backgroundMessage = `${queuedCount} arquivo(s) enviado(s). O Gemini continua processando em background e voce pode seguir navegando.`;
      }

      if (errors.length) {
        this.error = errors.join('\n');
      }
    };

    for (const file of files) {
      const localId = this.queueState.addPendingUpload(file.name);

      this.mediaService.analyzeVideo(file).subscribe({
        next: (res) => {
          queuedCount += 1;
          this.queueState.markQueued(localId, res.meetingId);
          onDone();
        },
        error: (err) => {
          this.queueState.markFailed(localId, err.message);
          errors.push(`${file.name}: ${err.message}`);
          onDone();
        },
      });
    }
  }

  onViewResult(meetingId: string) {
    this.router.navigate(['/meeting', meetingId]);
  }
}
