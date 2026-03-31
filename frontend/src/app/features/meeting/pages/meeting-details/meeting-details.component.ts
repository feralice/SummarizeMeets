import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VideoService } from '../../../../core/services/media-analysis.service';
import { Meeting } from '../../../../core/models/meeting.model';

@Component({
  selector: 'app-meeting-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meeting-details.component.html',
  styleUrls: ['./meeting-details.component.css'],
})
export class MeetingDetailsComponent implements OnInit {
  meeting: Meeting | null = null;
  loading = true;
  downloading = false;
  error: string | null = null;
  downloadError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMeeting(id);
    } else {
      this.error = 'ID da reunião não encontrado.';
      this.loading = false;
    }
  }

  loadMeeting(id: string): void {
    this.videoService.getMeetingById(id).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar os detalhes da reunião.';
        this.loading = false;
        console.error(err);
      },
    });
  }

  downloadRecording(): void {
    if (!this.meeting?.id || this.downloading) {
      return;
    }

    this.downloading = true;
    this.downloadError = null;

    this.videoService.getMeetingDownloadUrl(this.meeting.id).subscribe({
      next: (downloadUrl) => {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        this.downloading = false;
      },
      error: (err) => {
        this.downloadError = err.message || 'Nao foi possivel gerar o link de download.';
        this.downloading = false;
      },
    });
  }
}
