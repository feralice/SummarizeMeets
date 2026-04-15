import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeetingAnalysis } from '../../../../core/models/meeting-analysis.model';
import { buildMarkdown, buildPdf, downloadMarkdown } from '../../../../core/utils/export.utils';

@Component({
  selector: 'app-meeting-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meeting-result.component.html',
  styleUrls: ['./meeting-result.component.css'],
})
export class MeetingResultComponent {
  @Input() result!: MeetingAnalysis;
  @Output() close = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }

  exportToMarkdown(): void {
    const r = this.result;
    const content = buildMarkdown({
      title: r.summary.introduction.split('.')[0],
      summary: r.summary,
      topics: r.topics,
      decisions: r.decisions,
      actionItems: r.action_items,
      speakers: r.speakers,
    });
    downloadMarkdown(content, 'resumo-reuniao');
  }

  exportToPdf(): void {
    const r = this.result;
    const pdf = buildPdf({
      title: r.summary.introduction.split('.')[0],
      summary: r.summary,
      topics: r.topics,
      decisions: r.decisions,
      actionItems: r.action_items,
      speakers: r.speakers,
    });
    pdf.save('resumo-reuniao.pdf');
  }
}
