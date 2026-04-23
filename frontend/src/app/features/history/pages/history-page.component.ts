import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  MeetingHistoryService,
  MeetingDto,
  HistoryFilters,
  PaginationMeta,
} from '../../../core/services/meeting-history.service';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './history-page.component.html',
  styleUrls: ['./history-page.component.css'],
})
export class HistoryPageComponent implements OnInit, OnDestroy {
  meetings: MeetingDto[] = [];
  loading = false;
  error: string | null = null;
  pageSize = 10;
  currentPage = 1;
  pagination: PaginationMeta = {
    total: 0,
    page: 1,
    pageSize: 10,
    hasNextPage: false,
  };

  searchTerm = '';
  dateFrom = '';
  dateTo = '';
  hasActiveFilters = false;
  today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  confirmingDeleteId: string | null = null;
  deletingId: string | null = null;
  deleteError: string | null = null;
  successMessage: string | null = null;

  private searchSubject = new Subject<string>();
  private subs = new Subscription();
  private currentFilters: HistoryFilters = {};

  constructor(private historyService: MeetingHistoryService) {}

  ngOnInit(): void {
    this.subs.add(
      this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
        this.applyFilters();
      })
    );
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadHistory(filters: HistoryFilters = this.currentFilters, page = this.currentPage): void {
    this.loading = true;
    this.error = null;
    this.currentFilters = filters;
    this.currentPage = page;

    this.historyService.getHistory(filters, page, this.pageSize).subscribe({
      next: (res) => {
        this.meetings = res.data;
        this.pagination = res.meta;
        this.currentPage = res.meta.page;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Erro ao carregar histórico';
        this.loading = false;
      },
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onDateChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const filters: HistoryFilters = {
      search: this.searchTerm.trim() || undefined,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,
    };
    this.hasActiveFilters = !!(filters.search || filters.dateFrom || filters.dateTo);
    this.loadHistory(filters, 1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.hasActiveFilters = false;
    this.loadHistory({}, 1);
  }

  previousPage(): void {
    if (this.currentPage <= 1 || this.loading) return;
    this.loadHistory(this.currentFilters, this.currentPage - 1);
  }

  nextPage(): void {
    if (!this.pagination.hasNextPage || this.loading) return;
    this.loadHistory(this.currentFilters, this.currentPage + 1);
  }

  requestDelete(id: string): void {
    this.confirmingDeleteId = id;
    this.deleteError = null;
    this.successMessage = null;
  }

  cancelDelete(): void {
    this.confirmingDeleteId = null;
  }

  confirmDelete(id: string, title: string): void {
    this.deletingId = id;
    this.deleteError = null;

    this.historyService.deleteMeeting(id).subscribe({
      next: () => {
        this.confirmingDeleteId = null;
        this.deletingId = null;
        this.successMessage = `"${title}" excluída com sucesso.`;
        const nextPage = this.meetings.length === 1 && this.currentPage > 1 ? this.currentPage - 1 : this.currentPage;
        this.loadHistory(this.currentFilters, nextPage);
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (err) => {
        this.deleteError = err.message || 'Não foi possível excluir a reunião.';
        this.deletingId = null;
        this.confirmingDeleteId = null;
      },
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'processing': return 'Processando';
      case 'queued': return 'Na fila';
      case 'failed': return 'Falhou';
      default: return 'Concluído';
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-green';
      case 'processing': return 'badge-blue';
      case 'queued': return 'badge-gray';
      case 'failed': return 'badge-red';
      default: return 'badge-green';
    }
  }

  introduction(meeting: MeetingDto): string {
    const intro = meeting.summary?.introduction;
    if (!intro) return '';
    return intro.length > 160 ? intro.slice(0, 160) + '...' : intro;
  }

  isCompleted(status: string): boolean {
    return status === 'completed' || (!['processing', 'queued', 'failed'].includes(status));
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.pagination.total / this.pagination.pageSize));
  }
}
