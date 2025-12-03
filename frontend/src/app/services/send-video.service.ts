import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  public apiUrl = 'http://localhost:3000/api'; // Mudei para public para poder acessar

  constructor(private http: HttpClient) {}

  analyzeVideo(videoFile: File, prompt?: string): Observable<any> {
    const formData = new FormData();
    formData.append('video', videoFile);

    if (prompt) {
      formData.append('prompt', prompt);
    } else {
      formData.append(
        'prompt',
        'Analise este vídeo de reunião e forneça um resumo executivo dos principais pontos discutidos, decisões tomadas, ações pendentes com responsáveis, próximos passos e prazos, e insights relevantes para o time.'
      );
    }

    console.log('📦 FormData criado. Keys:');
    for (let pair of (formData as any).entries()) {
      console.log(`   ${pair[0]}:`, pair[1]);
    }

    return this.http
      .post(`${this.apiUrl}/analyze-video`, formData, {
        headers: {
          // Headers opcionais se precisar
        },
        reportProgress: true,
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('🔥 Erro HTTP:', error);

    let errorMessage = 'Erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do cliente
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      // Erro do servidor
      errorMessage = `Erro ${error.status}: ${error.message}`;

      if (error.error?.error) {
        errorMessage += `\nDetalhes: ${error.error.error}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
