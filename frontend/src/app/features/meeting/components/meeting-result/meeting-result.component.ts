import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MeetingAnalysis } from '../../../../core/models/meeting-analysis.model';

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

  @ViewChild('modalContent', { static: true })
  private modalContent!: ElementRef<HTMLElement>;

  closeModal(): void {
    this.close.emit();
  }

  async exportToPdf(): Promise<void> {
    const source = this.modalContent.nativeElement;
    const clone = source.cloneNode(true) as HTMLElement;

    clone.querySelectorAll('.no-print').forEach((el) => el.remove());

    Object.assign(clone.style, {
      maxHeight: 'none',
      overflow: 'visible',
      width: '960px',
      position: 'fixed',
      top: '0',
      left: '-9999px',
      background: '#ffffff',
    });

    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const width = pdf.internal.pageSize.getWidth() - margin * 2;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, width, height);
    pdf.save('resumo-reuniao.pdf');

    document.body.removeChild(clone);
  }
}
