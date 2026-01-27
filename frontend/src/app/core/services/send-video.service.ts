import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private apiUrl = 'http://localhost:3000/api/analyze-video';

  constructor(private http: HttpClient) {}

  analyzeVideo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('video', file);

    return this.http
      .post(this.apiUrl, formData, {
        reportProgress: true,
        observe: 'body',
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let msg = 'Erro inesperado no processamento.';
    if (error.error?.error) msg = error.error.error;
    return throwError(() => new Error(msg));
  }
}
