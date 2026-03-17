import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MeetingHistoryService, MeetingDto } from '../../../core/services/meeting-history.service';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  statusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'processing': return 'Processando';
      case 'queued': return 'Na fila';
      case 'failed': return 'Falhou';
      default: return 'Concluído';
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-green';
      case 'processing': return 'badge-blue';
      case 'queued': return 'badge-gray';
      case 'failed': return 'badge-red';
      default: return 'badge-green';
    }
  }

  introduction(meeting: MeetingDto): string {
    const intro = meeting.summary?.introduction;
    if (!intro) return '';
    return intro.length > 160 ? intro.slice(0, 160) + '...' : intro;
  }

  isCompleted(status: string): boolean {
    return status === 'completed' || (!['processing', 'queued', 'failed'].includes(status));
  }
}
