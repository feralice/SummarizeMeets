import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MEETING_ANALYSIS_PROMPT } from '../constants/meeting-analysis.prompt';
import { MeetingAnalysis } from '../models/meeting-analysis.model';

@Injectable({ providedIn: 'root' })
export class MediaAnalysisService {
  private apiUrl = 'http://localhost:3000/api/analyze-media';

  constructor(private http: HttpClient) {}

  analyzeMedia(file: File): Observable<MeetingAnalysis> {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('prompt', MEETING_ANALYSIS_PROMPT);

    return this.http.post<{ data: MeetingAnalysis }>(this.apiUrl, formData).pipe(
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

//Pra mockar o resultado da api:
/*import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MEETING_ANALYSIS_MOCK } from '../mocks/meeting-analysis.mock';
import { MeetingAnalysis } from '../models/meeting-analysis.model';

@Injectable({ providedIn: 'root' })
export class MediaAnalysisService {
  analyzeMedia(_: File): Observable<MeetingAnalysis> {
    return of(MEETING_ANALYSIS_MOCK);
  }
}
*/
