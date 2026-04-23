import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, map, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Meeting } from '../models/meeting.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  analyzeVideo(file: File): Observable<{ meetingId: string; status: string }> {
    const meetingTitle = file.name.replace(/\.[^/.]+$/, '');

    // Step 1: request pre-signed PUT URL from backend
    return this.http
      .post<{ uploadUrl: string; s3Key: string }>(`${this.apiUrl}/upload-url`, {
        mimeType: file.type,
      })
      .pipe(
        // Step 2: upload file directly to S3 (no Authorization header — excluded in interceptor)
        switchMap(({ uploadUrl, s3Key }) =>
          this.http
            .put(uploadUrl, file, {
              headers: { 'Content-Type': file.type },
            })
            .pipe(map(() => s3Key)),
        ),
        // Step 3: notify backend to analyze the uploaded file
        switchMap((s3Key) =>
          this.http
            .post<{
              data: { meetingId: string; status: string };
            }>(`${this.apiUrl}/analyze-media`, { s3Key, meetingTitle })
            .pipe(map((res) => res.data)),
        ),
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

  updateMeeting(
    id: string,
    fields: {
      meetingTitle?: string;
      summary?: Meeting['summary'];
      topics?: Meeting['topics'];
      decisions?: Meeting['decisions'];
      actionItems?: Meeting['actionItems'];
      speakers?: Meeting['speakers'];
    },
  ): Observable<Meeting> {
    return this.http.patch<{ data: Meeting }>(`${this.apiUrl}/meetings/${id}`, fields).pipe(
      map((res) => res.data),
      catchError(this.handleError),
    );
  }

  getMeetingDownloadUrl(id: string): Observable<string> {
    return this.http
      .get<{ data: { downloadUrl: string } }>(`${this.apiUrl}/meetings/${id}/download-url`)
      .pipe(
        map((res) => res.data.downloadUrl),
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
