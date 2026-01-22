import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './components/header/header.component';
import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';
import { ProcessingIndicatorComponent } from './components/processing-indicator/processing-indicator.component';
import { VideoService } from './services/send-video.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// quebrar em mais arquivos aq, ta bagunçado
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FileUploaderComponent,
    ProcessingIndicatorComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {
  selectedFile: File | null = null;
  meetingTitle = '';

  isProcessing = false;
  showProcessing = false;
  analysisResult: string | null = null;
  error: string | null = null;

  progress = 0;
  progressInterval: any;
  currentStage = 'Enviando arquivo...';

  constructor(private videoService: VideoService) {}

  /* ==========================
   *  PDF
   * ========================== */

  exportToPdf() {
    if (!this.analysisResult) return;

    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.padding = '24px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.innerHTML = `
      <h1 style="color:#1e293b;">
        ${this.meetingTitle || 'Resumo da Reunião'}
      </h1>
      <hr />
      ${this.formatAnalysisResult(this.analysisResult)}
    `;

    document.body.appendChild(container);

    html2canvas(container, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      const fileName = (this.meetingTitle || 'resumo-reuniao').replace(/\s+/g, '-').toLowerCase();

      pdf.save(`${fileName}.pdf`);
      document.body.removeChild(container);
    });
  }

  /* ==========================
   *  FILE FLOW
   * ========================== */

  onFileSelected(file: File) {
    this.selectedFile = file;
    this.error = null;
    this.analysisResult = null;
    this.progress = 0;
  }

  onFileRemoved() {
    this.selectedFile = null;
    this.meetingTitle = '';
    this.isProcessing = false;
    this.showProcessing = false;
    this.analysisResult = null;
    this.error = null;
    this.progress = 0;
    this.clearProgressInterval();
  }

  onGenerateSummary() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.showProcessing = true;
    this.error = null;
    this.analysisResult = null;
    this.progress = 0;

    this.startProgressSimulation();

    const prompt = `Analise este vídeo de reunião${
      this.meetingTitle ? ` intitulada "${this.meetingTitle}"` : ''
    } e forneça:
1. Um resumo executivo dos principais pontos discutidos
2. Lista de decisões tomadas
3. Ações pendentes com responsáveis (se identificados)
4. Próximos passos e prazos
5. Insights relevantes para o time`;

    this.videoService.analyzeVideo(this.selectedFile, prompt).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.showProcessing = false;
        this.clearProgressInterval();
        this.progress = 100;

        this.analysisResult = response.result || response.data || response;

        if (this.analysisResult) {
          this.showResultModal(this.analysisResult);
        }
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.showProcessing = false;
        this.clearProgressInterval();

        if (err.status === 413) {
          this.error = 'Arquivo muito grande. Tamanho máximo: 2GB';
        } else if (err.status === 415) {
          this.error = 'Tipo de arquivo não suportado. Use vídeos MP4, MOV ou AVI.';
        } else if (err.status === 0 || err.status === 404) {
          this.error =
            'Não foi possível conectar ao servidor. Verifique se a API está rodando em http://localhost:3000';
        } else if (err.status === 500) {
          this.error = 'Erro interno no servidor. Tente novamente mais tarde.';
        } else {
          this.error =
            err.error?.error || err.message || 'Erro ao processar o vídeo. Tente novamente.';
        }

        alert(`Erro: ${this.error}`);
      },
    });
  }

  /* ==========================
   *  PROGRESS
   * ========================== */

  private startProgressSimulation() {
    this.currentStage = 'Enviando arquivo...';
    this.progress = 10;

    this.progressInterval = setInterval(() => {
      if (this.progress < 90) {
        this.progress++;

        if (this.progress >= 30 && this.progress < 50) {
          this.currentStage = 'Extraindo áudio...';
        } else if (this.progress >= 50 && this.progress < 70) {
          this.currentStage = 'Transcrevendo conteúdo...';
        } else if (this.progress >= 70) {
          this.currentStage = 'Analisando com IA...';
        }
      }
    }, 1000);
  }

  private clearProgressInterval() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /* ==========================
   *  MODAL
   * ========================== */

  showFullResult() {
    if (this.analysisResult) {
      this.showResultModal(this.analysisResult);
    }
  }

  private showResultModal(result: string) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 800px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    `;

    const title = document.createElement('h2');
    title.textContent = this.meetingTitle ? `📊 ${this.meetingTitle}` : '📊 Resumo da Reunião';
    title.style.cssText = `
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
      padding: 8px;
      border-radius: 6px;
    `;
    closeButton.onclick = () => modal.remove();

    modalHeader.appendChild(title);
    modalHeader.appendChild(closeButton);

    const resultContent = document.createElement('div');
    resultContent.innerHTML = this.formatAnalysisResult(result);
    resultContent.style.cssText = `
      line-height: 1.6;
      color: #334155;
      white-space: pre-wrap;
      font-size: 16px;
    `;

    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 12px;
      margin-top: 32px;
      justify-content: flex-end;
    `;

    const exportPdfButton = document.createElement('button');
    exportPdfButton.textContent = '📄 Exportar PDF';
    exportPdfButton.style.cssText = `
      background: #16a34a;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    exportPdfButton.onclick = () => this.exportToPdf();

    const copyButton = document.createElement('button');
    copyButton.textContent = '📋 Copiar Resumo';
    copyButton.style.cssText = `
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    copyButton.onclick = () => navigator.clipboard.writeText(result);

    const closeModalButton = document.createElement('button');
    closeModalButton.textContent = 'Fechar';
    closeModalButton.style.cssText = `
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    closeModalButton.onclick = () => modal.remove();

    actions.appendChild(exportPdfButton);
    actions.appendChild(copyButton);
    actions.appendChild(closeModalButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(resultContent);
    modalContent.appendChild(actions);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
  }

  /* ==========================
   *  FORMATTER
   * ========================== */

  private formatAnalysisResult(result: string): string {
    return result
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(
        /(\d+\.\s.*?)(?=\n\d+\.|\n\n|$)/gs,
        '<h3 style="margin: 20px 0 10px 0; color: #2563eb;">$1</h3>'
      )
      .replace(/\n\n/g, '<br><br>')
      .replace(/<li>/g, '<li style="margin-bottom: 8px;">');
  }

  ngOnDestroy() {
    this.clearProgressInterval();
  }
}
