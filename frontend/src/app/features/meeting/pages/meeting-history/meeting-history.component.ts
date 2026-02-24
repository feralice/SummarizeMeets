import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { VideoService } from '../../../../core/services/send-video.service';
import { UserIdService } from '../../../../core/services/user-id.service';
import { Meeting } from '../../../../core/models/meeting.model';

@Component({
  selector: 'app-meeting-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meeting-history.component.html',
  styleUrls: ['./meeting-history.component.css'],
})
export class MeetingHistoryComponent implements OnInit {
  meetings: Meeting[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private videoService: VideoService,
    private userIdService: UserIdService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    const userId = this.userIdService.getUserId();
    if (!userId) {
      this.loading = false;
      return;
    }

    this.videoService.getUserMeetings(userId).subscribe({
      next: (meetings) => {
        this.meetings = meetings;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar o histórico.';
        this.loading = false;
        console.error(err);
      },
    });
  }

  viewDetails(id: string): void {
    this.router.navigate(['/meeting', id]);
  }
}
