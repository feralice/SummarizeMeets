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
  @Input() message = 'Processando…';
  @Input() currentStage = '';
}
