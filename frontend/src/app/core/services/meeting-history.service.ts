import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface MeetingDto {
  id?: string;
  meetingTitle: string;
  meetingDate: string;
  summary: string;
  actionPoints: string;
  notes?: string;
  status: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingHistoryService {
  private apiUrl = 'http://localhost:3000/api/history';

  constructor(private http: HttpClient) {}

  getHistory(userId: string): Observable<MeetingDto[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<MeetingDto[]>(this.apiUrl, { params }).pipe(
      map((res) => res || []),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse | Error) {
    const msg = error instanceof Error ? error.message : error.error?.error || 'Erro inesperado';
    return throwError(() => new Error(msg));
  }
}
