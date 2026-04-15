import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MeetingDto {
  id?: string;
  meetingTitle: string;
  meetingDate: string;
  summary: any;
  topics: any[];
  decisions: string[];
  actionItems: any[];
  speakers: any[];
  status: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingHistoryService {
  private apiUrl = `${environment.apiUrl}/history`;

  constructor(private http: HttpClient) {}

  getHistory(): Observable<MeetingDto[]> {
    return this.http.get<{ data: MeetingDto[] }>(this.apiUrl).pipe(
      map((res) => res.data || []),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse | Error) {
    const msg = error instanceof Error ? error.message : error.error?.error || 'Erro inesperado';
    return throwError(() => new Error(msg));
  }
}
