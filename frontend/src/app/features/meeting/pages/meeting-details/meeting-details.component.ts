import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VideoService } from '../../../../core/services/media-analysis.service';
import { MeetingHistoryService } from '../../../../core/services/meeting-history.service';
import { Meeting } from '../../../../core/models/meeting.model';
import { buildMarkdown, buildPdf, downloadMarkdown } from '../../../../core/utils/export.utils';

type EditableSection =
  | 'introduction'
  | 'keyPoints'
  | 'conclusion'
  | 'topics'
  | 'decisions'
  | 'actionItems'
  | 'speakers';

@Component({
  selector: 'app-meeting-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './meeting-details.component.html',
  styleUrls: ['./meeting-details.component.css'],
})
export class MeetingDetailsComponent implements OnInit {
  meeting: Meeting | null = null;
  loading = true;
  downloading = false;
  exporting = false;
  error: string | null = null;
  downloadError: string | null = null;

  editingTitle = false;
  editingSection: EditableSection | null = null;
  saving = false;
  saveError: string | null = null;
  saveSuccess: string | null = null;

  titleDraft = '';
  introductionDraft = '';
  conclusionDraft = '';
  keyPointsDraft = '';
  decisionsDraft = '';
  topicsDraft: Meeting['topics'] = [];
  actionItemsDraft: Meeting['actionItems'] = [];
  speakersDraft: Meeting['speakers'] = [];

  showDeleteConfirm = false;
  deleting = false;
  deleteError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService,
    private historyService: MeetingHistoryService,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMeeting(id);
    } else {
      this.error = 'ID da reunião não encontrado.';
      this.loading = false;
    }
  }

  loadMeeting(id: string): void {
    this.videoService.getMeetingById(id).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar os detalhes da reunião.';
        this.loading = false;
        console.error(err);
      },
    });
  }

  startEditTitle(): void {
    if (!this.meeting) return;
    this.titleDraft = this.meeting.meetingTitle;
    this.editingTitle = true;
    this.saveError = null;
    this.saveSuccess = null;
  }

  cancelEditTitle(): void {
    this.editingTitle = false;
  }

  saveTitle(): void {
    if (!this.meeting || !this.titleDraft.trim() || this.saving) return;
    this.saving = true;
    this.saveError = null;

    this.videoService.updateMeeting(this.meeting.id, { meetingTitle: this.titleDraft.trim() }).subscribe({
      next: (updated) => {
        this.meeting = updated;
        this.editingTitle = false;
        this.saving = false;
        this.showSaveSuccess('Título atualizado.');
      },
      error: (err) => {
        this.saveError = err.message || 'Erro ao salvar.';
        this.saving = false;
      },
    });
  }

  startEditIntroduction(): void {
    if (!this.meeting?.summary) return;
    this.introductionDraft = (this.meeting.summary as any).introduction ?? '';
    this.startEditing('introduction');
  }

  startEditKeyPoints(): void {
    if (!this.meeting?.summary) return;
    this.keyPointsDraft = this.meeting.summary.key_points.join('\n');
    this.startEditing('keyPoints');
  }

  startEditConclusion(): void {
    if (!this.meeting?.summary) return;
    this.conclusionDraft = this.meeting.summary.conclusion ?? '';
    this.startEditing('conclusion');
  }

  startEditTopics(): void {
    if (!this.meeting) return;
    this.topicsDraft = this.meeting.topics.map((topic) => ({ ...topic }));
    this.startEditing('topics');
  }

  startEditDecisions(): void {
    if (!this.meeting) return;
    this.decisionsDraft = this.meeting.decisions.join('\n');
    this.startEditing('decisions');
  }

  startEditActionItems(): void {
    if (!this.meeting) return;
    this.actionItemsDraft = this.meeting.actionItems.map((item) => ({ ...item }));
    this.startEditing('actionItems');
  }

  startEditSpeakers(): void {
    if (!this.meeting) return;
    this.speakersDraft = this.meeting.speakers.map((speaker) => ({ ...speaker }));
    this.startEditing('speakers');
  }

  cancelEditSection(): void {
    this.editingSection = null;
  }

  saveIntroduction(): void {
    if (!this.meeting) return;
    const introduction = this.introductionDraft.trim();
    if (!introduction) {
      this.saveError = 'A introdução não pode ficar vazia.';
      return;
    }

    this.saveSummary({ introduction }, 'Introdução atualizada.');
  }

  saveKeyPoints(): void {
    if (!this.meeting) return;
    const keyPoints = this.linesFromText(this.keyPointsDraft);
    if (!keyPoints.length) {
      this.saveError = 'Informe pelo menos um ponto principal.';
      return;
    }

    this.saveSummary({ key_points: keyPoints }, 'Pontos principais atualizados.');
  }

  saveConclusion(): void {
    if (!this.meeting) return;
    const conclusion = this.conclusionDraft.trim();
    if (!conclusion) {
      this.saveError = 'A conclusão não pode ficar vazia.';
      return;
    }

    this.saveSummary({ conclusion }, 'Conclusão atualizada.');
  }

  saveTopics(): void {
    const topics = this.topicsDraft
      .map((topic) => ({ title: topic.title.trim(), description: topic.description.trim() }))
      .filter((topic) => topic.title || topic.description);

    if (topics.some((topic) => !topic.title || !topic.description)) {
      this.saveError = 'Cada tópico precisa ter título e descrição.';
      return;
    }

    this.saveFields({ topics }, 'Tópicos atualizados.');
  }

  saveDecisions(): void {
    this.saveFields({ decisions: this.linesFromText(this.decisionsDraft) }, 'Decisões atualizadas.');
  }

  saveActionItems(): void {
    const actionItems = this.actionItemsDraft
      .map((item) => ({
        task: item.task.trim(),
        responsible: item.responsible?.trim() || null,
        deadline: item.deadline?.trim() || null,
        needs_review: item.needs_review,
      }))
      .filter((item) => item.task || item.responsible || item.deadline);

    if (actionItems.some((item) => !item.task)) {
      this.saveError = 'Cada próximo passo precisa ter uma tarefa.';
      return;
    }
    if (actionItems.some((item) => item.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(item.deadline))) {
      this.saveError = 'Use datas no formato AAAA-MM-DD.';
      return;
    }

    this.saveFields({ actionItems }, 'Próximos passos atualizados.');
  }

  saveSpeakers(): void {
    const speakers = this.speakersDraft
      .map((speaker) => ({
        speaker: speaker.speaker.trim(),
        description: speaker.description.trim(),
      }))
      .filter((speaker) => speaker.speaker || speaker.description);

    if (speakers.some((speaker) => !speaker.speaker || !speaker.description)) {
      this.saveError = 'Cada participante precisa ter nome e descrição.';
      return;
    }

    this.saveFields({ speakers }, 'Participantes atualizados.');
  }

  addTopic(): void {
    this.topicsDraft.push({ title: '', description: '' });
  }

  removeTopic(index: number): void {
    this.topicsDraft.splice(index, 1);
  }

  addActionItem(): void {
    this.actionItemsDraft.push({ task: '', responsible: null, deadline: null, needs_review: false });
  }

  removeActionItem(index: number): void {
    this.actionItemsDraft.splice(index, 1);
  }

  addSpeaker(): void {
    this.speakersDraft.push({ speaker: '', description: '' });
  }

  removeSpeaker(index: number): void {
    this.speakersDraft.splice(index, 1);
  }

  private startEditing(section: EditableSection): void {
    this.editingSection = section;
    this.saveError = null;
    this.saveSuccess = null;
  }

  private saveSummary(summaryPatch: Partial<Meeting['summary']>, message: string): void {
    if (!this.meeting) return;
    this.saveFields(
      {
        summary: {
          ...this.meeting.summary,
          ...summaryPatch,
        },
      },
      message,
    );
  }

  private saveFields(fields: Parameters<VideoService['updateMeeting']>[1], message: string): void {
    if (!this.meeting || this.saving) return;
    this.saving = true;
    this.saveError = null;

    this.videoService.updateMeeting(this.meeting.id, fields).subscribe({
      next: (updated) => {
        this.meeting = updated;
        this.editingSection = null;
        this.saving = false;
        this.showSaveSuccess(message);
      },
      error: (err) => {
        this.saveError = err.message || 'Erro ao salvar.';
        this.saving = false;
      },
    });
  }

  private linesFromText(value: string): string[] {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  private showSaveSuccess(message: string): void {
    this.saveSuccess = message;
    setTimeout(() => (this.saveSuccess = null), 3500);
  }

  exportToMarkdown(): void {
    if (!this.meeting) return;
    const m = this.meeting;
    const content = buildMarkdown({
      title: m.meetingTitle,
      date: new Date(m.meetingDate).toLocaleDateString('pt-BR'),
      summary: m.summary,
      topics: m.topics,
      decisions: m.decisions,
      actionItems: m.actionItems,
      speakers: m.speakers,
    });
    downloadMarkdown(content, m.meetingTitle.replace(/\s+/g, '-'));
  }

  exportToPdf(): void {
    if (!this.meeting || this.exporting) return;
    this.exporting = true;
    const m = this.meeting;
    const pdf = buildPdf({
      title: m.meetingTitle,
      date: new Date(m.meetingDate).toLocaleDateString('pt-BR'),
      summary: m.summary,
      topics: m.topics,
      decisions: m.decisions,
      actionItems: m.actionItems,
      speakers: m.speakers,
    });
    pdf.save(`${m.meetingTitle.replace(/\s+/g, '-')}.pdf`);
    this.exporting = false;
  }

  requestDelete(): void {
    this.showDeleteConfirm = true;
    this.deleteError = null;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    if (!this.meeting?.id || this.deleting) return;
    this.deleting = true;
    this.deleteError = null;

    this.historyService.deleteMeeting(this.meeting.id).subscribe({
      next: () => {
        this.router.navigate(['/history']);
      },
      error: (err) => {
        this.deleteError = err.message || 'Não foi possível excluir a reunião.';
        this.deleting = false;
        this.showDeleteConfirm = false;
      },
    });
  }

  downloadRecording(): void {
    if (!this.meeting?.id || this.downloading) {
      return;
    }

    this.downloading = true;
    this.downloadError = null;

    this.videoService.getMeetingDownloadUrl(this.meeting.id).subscribe({
      next: (downloadUrl) => {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        this.downloading = false;
      },
      error: (err) => {
        this.downloadError = err.message || 'Nao foi possivel gerar o link de download.';
        this.downloading = false;
      },
    });
  }
}
