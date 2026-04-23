import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
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

export interface HistoryFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface PaginatedHistory {
  data: MeetingDto[];
  meta: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class MeetingHistoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHistory(filters?: HistoryFilters, page = 1, pageSize = 10): Observable<PaginatedHistory> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    params = params.set('page', page);
    params = params.set('pageSize', pageSize);

    return this.http.get<PaginatedHistory>(`${this.apiUrl}/history`, { params }).pipe(
      map((res) => ({ data: res.data || [], meta: res.meta })),
      catchError(this.handleError),
    );
  }

  deleteMeeting(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/meetings/${id}`).pipe(
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse | Error) {
    const msg = error instanceof Error ? error.message : error.error?.error || 'Erro inesperado';
    return throwError(() => new Error(msg));
  }
}
