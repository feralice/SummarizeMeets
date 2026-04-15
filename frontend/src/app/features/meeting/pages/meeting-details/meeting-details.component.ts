import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VideoService } from '../../../../core/services/media-analysis.service';
import { Meeting } from '../../../../core/models/meeting.model';
import { buildMarkdown, buildPdf, downloadMarkdown } from '../../../../core/utils/export.utils';

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
  exporting = false;
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

  exportToMarkdown(): void {
    if (!this.meeting) return;
    const m = this.meeting;
    const content = buildMarkdown({
      title: m.meetingTitle,
      date: new Date(m.meetingDate).toLocaleDateString('pt-BR'),
      summary: m.summary,
      topics: m.topics,
      decisions: m.decisions,
      actionItems: m.actionItems,
      speakers: m.speakers,
    });
    downloadMarkdown(content, m.meetingTitle.replace(/\s+/g, '-'));
  }

  exportToPdf(): void {
    if (!this.meeting || this.exporting) return;
    this.exporting = true;
    const m = this.meeting;
    const pdf = buildPdf({
      title: m.meetingTitle,
      date: new Date(m.meetingDate).toLocaleDateString('pt-BR'),
      summary: m.summary,
      topics: m.topics,
      decisions: m.decisions,
      actionItems: m.actionItems,
      speakers: m.speakers,
    });
    pdf.save(`${m.meetingTitle.replace(/\s+/g, '-')}.pdf`);
    this.exporting = false;
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
