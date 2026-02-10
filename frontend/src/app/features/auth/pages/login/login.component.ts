import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  error: string | null = null;
  isLoginMode = true; // true para login, false para registro

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    if (this.isLoginMode) {
      this.loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    } else {
      this.loginForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      });
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.error = null;
    this.initializeForm();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.error = 'Por favor, preencha todos os campos corretamente.';
      return;
    }

    if (
      !this.isLoginMode &&
      this.loginForm.get('password')?.value !== this.loginForm.get('confirmPassword')?.value
    ) {
      this.error = 'As senhas não correspondem.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Preparar dados para envio
    let submitData: any;
    if (this.isLoginMode) {
      submitData = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
      };
      console.log('[Login Component] Tentando fazer login com:', submitData.email);
    } else {
      submitData = {
        name: this.loginForm.get('name')?.value,
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
      };
      console.log('[Login Component] Tentando registrar:', submitData.email);
    }

    const request = this.isLoginMode
      ? this.authService.login(submitData)
      : this.authService.register(submitData);

    request.subscribe({
      next: (response) => {
        console.log('[Login Component] ✅ Autenticação bem-sucedida:', response.user.email);
        console.log('[Login Component] Navegando para /');
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('[Login Component] ❌ Erro de autenticação:', error);
        this.error = error.error?.message || 'Erro ao processar solicitação. Tente novamente.';
        this.isLoading = false;
      },
    });
  }
}
