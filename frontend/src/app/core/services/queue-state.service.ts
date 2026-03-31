import { inject, Injectable, signal } from '@angular/core';
import { timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { VideoService } from './media-analysis.service';

export interface QueueItem {
  localId: string;
  meetingId?: string;
  fileName: string;
  status: 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

const POLL_INTERVAL_MS = 4000;

@Injectable({ providedIn: 'root' })
export class QueueStateService {
  private mediaService = inject(VideoService);

  private _queue = signal<QueueItem[]>([]);
  readonly queue = this._queue.asReadonly();

  addPendingUpload(fileName: string): string {
    const localId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    this._queue.update((queue) => [...queue, { localId, fileName, status: 'uploading' }]);
    return localId;
  }

  markQueued(localId: string, meetingId: string): void {
    this.updateItem(localId, {
      meetingId,
      status: 'queued',
      errorMessage: undefined,
    });

    this.startPolling(localId, meetingId);
  }

  markFailed(localId: string, errorMessage?: string): void {
    this.updateItem(localId, { status: 'failed', errorMessage });
  }

  private updateStatus(
    localId: string,
    status: Extract<QueueItem['status'], 'queued' | 'processing' | 'completed' | 'failed'>,
    errorMessage?: string
  ): void {
    this.updateItem(localId, {
      status,
      ...(errorMessage ? { errorMessage } : {}),
    });
  }

  private updateItem(localId: string, partial: Partial<QueueItem>): void {
    this._queue.update((queue) =>
      queue.map((item) => (item.localId === localId ? { ...item, ...partial } : item))
    );
  }

  private startPolling(localId: string, meetingId: string): void {
    timer(0, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.mediaService.getMeetingById(meetingId)),
        takeWhile((meeting) => meeting.status !== 'completed' && meeting.status !== 'failed', true)
      )
      .subscribe({
        next: (meeting) =>
          this.updateStatus(
            localId,
            meeting.status as Extract<QueueItem['status'], 'queued' | 'processing' | 'completed' | 'failed'>
          ),
        error: (err: any) =>
          this.updateStatus(localId, 'failed', err?.message || 'Erro de conexao com o servidor'),
      });
  }
}
