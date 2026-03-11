import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MEETING_ANALYSIS_PROMPT } from '../constants/meeting-analysis.prompt';
import { MeetingAnalysis } from '../models/meeting-analysis.model';
import { UserIdService } from './user-id.service';
import { Meeting } from '../models/meeting.model';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private userIdService: UserIdService
  ) { }

  analyzeVideo(file: File): Observable<MeetingAnalysis & { id: string }> {
    const userId = this.userIdService.getUserId() || '';
    const formData = new FormData();
    formData.append('video', file);
    formData.append('prompt', MEETING_ANALYSIS_PROMPT);
    formData.append('userId', userId);
    formData.append('title', file.name.split('.')[0]);

    return this.http.post<{ data: MeetingAnalysis & { id: string } }>(`${this.apiUrl}/analyze-media`, formData).pipe(
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  getUserMeetings(userId: string): Observable<Meeting[]> {
    return this.http.get<{ data: Meeting[] }>(`${this.apiUrl}/meetings/user/${userId}`).pipe(
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  getMeetingById(id: string): Observable<Meeting> {
    return this.http.get<{ data: Meeting }>(`${this.apiUrl}/meetings/${id}`).pipe(
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse | Error) {
    const msg =
      error instanceof Error
        ? error.message
        : error.error?.error || 'Erro inesperado no processamento';
    return throwError(() => new Error(msg));
  }
}

//Pra mockar o rsultado da api:
/*import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MEETING_ANALYSIS_MOCK } from '../mocks/meeting-analysis.mock';
import { MeetingAnalysis } from '../models/meeting-analysis.model';

@Injectable({ providedIn: 'root' })
export class VideoService {
  analyzeVideo(_: File): Observable<MeetingAnalysis> {
    return of(MEETING_ANALYSIS_MOCK);
  }
}
*/
