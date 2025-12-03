import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-processing-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processing-indicator.component.html',
  styleUrls: ['./processing-indicator.component.css'],
})
export class ProcessingIndicatorComponent {
  @Input() message: string = 'Processando vídeo com IA...';
  @Input() subMessage: string = 'Isso pode levar alguns minutos';
  @Input() currentStage: string = 'Iniciando processamento...';
  @Input() progress: number = 0;
  @Input() show: boolean = true;
}
