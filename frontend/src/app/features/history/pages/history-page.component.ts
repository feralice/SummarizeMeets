import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeetingHistoryService, MeetingDto } from '../../../core/services/meeting-history.service';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-page.component.html',
  styleUrls: ['./history-page.component.css'],
})
export class HistoryPageComponent implements OnInit {
  meetings: MeetingDto[] = [];
  loading = false;
  error: string | null = null;

  constructor(private historyService: MeetingHistoryService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.error = null;
    this.historyService.getHistory().subscribe({
      next: (res) => {
        this.meetings = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Erro ao carregar histórico';
        this.loading = false;
      },
    });
  }
}
