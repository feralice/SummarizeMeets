import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, AuthUser } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css'],
})
export class ProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  user: AuthUser | null = null;
  loading = true;
  savingName = false;
  savingPassword = false;
  loadError: string | null = null;
  nameSuccess: string | null = null;
  nameError: string | null = null;
  passwordSuccess: string | null = null;
  passwordError: string | null = null;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  toggleCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({ name: user.name });
        this.loading = false;
      },
      error: (err) => {
        this.loadError = err.error?.error || 'Não foi possível carregar seu perfil.';
        this.loading = false;
      },
    });
  }

  saveName(): void {
    if (this.profileForm.invalid || this.savingName) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const name = this.profileForm.value.name?.trim() || '';
    this.savingName = true;
    this.nameError = null;
    this.nameSuccess = null;

    this.authService.updateProfile({ name }).subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({ name: user.name });
        this.nameSuccess = 'Nome atualizado com sucesso.';
        this.savingName = false;
      },
      error: (err) => {
        this.nameError = err.error?.error || 'Não foi possível atualizar seu nome.';
        this.savingName = false;
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.passwordError = 'A confirmação da senha não confere.';
      return;
    }

    this.savingPassword = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    this.authService
      .changePassword({
        currentPassword: currentPassword || '',
        newPassword: newPassword || '',
        confirmPassword: confirmPassword || '',
      })
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.passwordSuccess = 'Senha alterada com sucesso.';
          this.savingPassword = false;
        },
        error: (err) => {
          this.passwordError = err.error?.error || 'Não foi possível alterar sua senha.';
          this.savingPassword = false;
        },
      });
  }
}
