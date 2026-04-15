import jsPDF from 'jspdf';

export interface ExportData {
  title: string;
  date?: string;
  summary?: {
    introduction: string;
    key_points: string[];
    conclusion: string;
  };
  topics?: { title: string; description: string }[];
  decisions?: string[];
  actionItems?: { task: string; responsible: string | null; deadline: string | null }[];
  speakers?: { speaker: string; description: string }[];
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

export function buildMarkdown(data: ExportData): string {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  if (data.date) lines.push(`**Data:** ${data.date}`);
  lines.push('');

  if (data.summary) {
    lines.push('## Introdução');
    lines.push(data.summary.introduction);
    lines.push('');

    if (data.summary.key_points?.length) {
      lines.push('## Pontos Principais');
      data.summary.key_points.forEach((p) => lines.push(`- ${p}`));
      lines.push('');
    }

    if (data.summary.conclusion) {
      lines.push('## Conclusão');
      lines.push(data.summary.conclusion);
      lines.push('');
    }
  }

  if (data.topics?.length) {
    lines.push('## Tópicos Discutidos');
    data.topics.forEach((t) => {
      lines.push(`### ${t.title}`);
      lines.push(t.description);
      lines.push('');
    });
  }

  if (data.decisions?.length) {
    lines.push('## Decisões');
    data.decisions.forEach((d) => lines.push(`- ${d}`));
    lines.push('');
  }

  if (data.actionItems?.length) {
    lines.push('## Próximos Passos');
    lines.push('| Tarefa | Responsável | Prazo |');
    lines.push('|--------|-------------|-------|');
    data.actionItems.forEach((a) =>
      lines.push(`| ${a.task} | ${a.responsible ?? '—'} | ${a.deadline ?? '—'} |`)
    );
    lines.push('');
  }

  if (data.speakers?.length) {
    lines.push('## Participantes');
    data.speakers.forEach((s) => lines.push(`**${s.speaker}** — ${s.description}`));
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

const PAGE_WIDTH = 210;   // A4 mm
const PAGE_HEIGHT = 297;  // A4 mm
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function buildPdf(data: ExportData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN;

  const checkPage = (needed = 8) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      pdf.addPage();
      y = MARGIN;
    }
  };

  const writeText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color = '#111111') => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(text, CONTENT_WIDTH) as string[];
    lines.forEach((line: string) => {
      checkPage(size * 0.4);
      pdf.text(line, MARGIN, y);
      y += size * 0.4;
    });
  };

  const writeSectionTitle = (text: string) => {
    checkPage(12);
    y += 4;
    pdf.setDrawColor('#e2e8f0');
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 4;
    writeText(text, 13, 'bold', '#1a202c');
    y += 2;
  };

  const writeBullet = (text: string) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#374151');
    const lines = pdf.splitTextToSize(`• ${text}`, CONTENT_WIDTH - 4) as string[];
    lines.forEach((line: string, i: number) => {
      checkPage(5);
      pdf.text(i === 0 ? line : `  ${line}`, MARGIN + 2, y);
      y += 4.5;
    });
  };

  // Title
  writeText(data.title, 18, 'bold', '#1a202c');
  y += 1;
  if (data.date) {
    writeText(data.date, 10, 'normal', '#6b7280');
    y += 1;
  }

  // Summary
  if (data.summary) {
    writeSectionTitle('Introdução');
    writeText(data.summary.introduction, 10, 'normal', '#374151');
    y += 3;

    if (data.summary.key_points?.length) {
      writeSectionTitle('Pontos Principais');
      data.summary.key_points.forEach((p) => writeBullet(p));
      y += 2;
    }

    if (data.summary.conclusion) {
      writeSectionTitle('Conclusão');
      writeText(data.summary.conclusion, 10, 'normal', '#374151');
      y += 3;
    }
  }

  // Topics
  if (data.topics?.length) {
    writeSectionTitle('Tópicos Discutidos');
    data.topics.forEach((t) => {
      checkPage(10);
      writeText(t.title, 11, 'bold', '#1a202c');
      y += 1;
      writeText(t.description, 10, 'normal', '#374151');
      y += 3;
    });
  }

  // Decisions
  if (data.decisions?.length) {
    writeSectionTitle('Decisões');
    data.decisions.forEach((d) => writeBullet(d));
    y += 2;
  }

  // Action items
  if (data.actionItems?.length) {
    writeSectionTitle('Próximos Passos');
    data.actionItems.forEach((a) => {
      checkPage(14);
      writeText(a.task, 10, 'bold', '#1a202c');
      y += 1;
      const meta = [
        a.responsible ? `Responsável: ${a.responsible}` : null,
        a.deadline ? `Prazo: ${a.deadline}` : null,
      ]
        .filter(Boolean)
        .join('   ');
      if (meta) {
        writeText(meta, 9, 'normal', '#6b7280');
      }
      y += 3;
    });
  }

  // Speakers
  if (data.speakers?.length) {
    writeSectionTitle('Participantes');
    data.speakers.forEach((s) => {
      checkPage(10);
      writeText(s.speaker, 10, 'bold', '#1a202c');
      y += 1;
      writeText(s.description, 10, 'normal', '#374151');
      y += 3;
    });
  }

  return pdf;
}
