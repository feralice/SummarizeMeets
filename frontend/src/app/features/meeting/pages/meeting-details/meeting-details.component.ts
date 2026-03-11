import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService
  ) {}

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
}
