import { inject, Injectable, signal } from '@angular/core';
import { interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { VideoService } from './media-analysis.service';

export interface QueueItem {
  meetingId: string;
  fileName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

const POLL_INTERVAL_MS = 4000;

@Injectable({ providedIn: 'root' })
export class QueueStateService {
  private mediaService = inject(VideoService);

  private _queue = signal<QueueItem[]>([]);
  readonly queue = this._queue.asReadonly();

  addItem(item: QueueItem): void {
    this._queue.update(q => [...q, item]);
    this.startPolling(item.meetingId);
  }

  private updateStatus(meetingId: string, status: QueueItem['status'], errorMessage?: string): void {
    this._queue.update(q =>
      q.map(i => i.meetingId === meetingId ? { ...i, status, ...(errorMessage ? { errorMessage } : {}) } : i)
    );
  }

  private startPolling(meetingId: string): void {
    // takeWhile with inclusive=true emits the terminal value then completes —
    // no manual teardown needed; the subscription ends itself when job finishes.
    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.mediaService.getMeetingById(meetingId)),
        takeWhile(m => m.status !== 'completed' && m.status !== 'failed', true),
      )
      .subscribe({
        next: (meeting) => this.updateStatus(meetingId, meeting.status as QueueItem['status']),
        error: (err: any) => this.updateStatus(
          meetingId,
          'failed',
          err?.message || 'Erro de conexão com o servidor'
        ),
      });
  }
}
