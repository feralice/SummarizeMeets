import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QueueItem } from '../../../../core/services/queue-state.service';

@Component({
  selector: 'app-queue-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './queue-list.component.html',
  styleUrls: ['./queue-list.component.css'],
})
export class QueueListComponent {
  @Input() items: QueueItem[] = [];
  @Output() viewResult = new EventEmitter<string>(); // emits meetingId

  get allDone(): boolean {
    return this.items.length > 0 &&
      this.items.every(i => i.status === 'completed' || i.status === 'failed');
  }

  statusLabel(status: QueueItem['status']): string {
    switch (status) {
      case 'queued': return 'Na fila';
      case 'processing': return 'Processando...';
      case 'completed': return 'Concluído';
      case 'failed': return 'Falhou - tente novamente';
      default: return 'Concluído';
    }
  }

  statusClass(status: QueueItem['status']): string {
    switch (status) {
      case 'queued': return 'badge-gray';
      case 'processing': return 'badge-blue';
      case 'completed': return 'badge-green';
      case 'failed': return 'badge-red';
      default: return 'badge-green';
    }
  }
}
