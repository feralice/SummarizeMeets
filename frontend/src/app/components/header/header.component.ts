import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  onHistoryClick() {
    console.log('Histórico clicado');
    // Implementar navegação para histórico
  }

  onLoginClick() {
    console.log('Login clicado');
    // Implementar lógica de login
  }
}
