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
  @Output() viewResult = new EventEmitter<string>();

  get allDone(): boolean {
    return this.items.length > 0 && this.items.every((item) => item.status === 'completed' || item.status === 'failed');
  }

  get hasActiveBackgroundWork(): boolean {
    return this.items.some(
      (item) => item.status === 'uploading' || item.status === 'queued' || item.status === 'processing'
    );
  }

  statusLabel(status: QueueItem['status']): string {
    switch (status) {
      case 'uploading':
        return 'Enviando arquivo...';
      case 'queued':
        return 'Na fila';
      case 'processing':
        return 'Processando...';
      case 'completed':
        return 'Concluido';
      case 'failed':
        return 'Falhou - tente novamente';
      default:
        return 'Concluido';
    }
  }

  statusClass(status: QueueItem['status']): string {
    switch (status) {
      case 'uploading':
        return 'badge-indigo';
      case 'queued':
        return 'badge-gray';
      case 'processing':
        return 'badge-blue';
      case 'completed':
        return 'badge-green';
      case 'failed':
        return 'badge-red';
      default:
        return 'badge-green';
    }
  }
}
