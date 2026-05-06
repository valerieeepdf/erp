import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  name = '';
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);

  nameError = '';
  emailError = '';
  usernameError = '';
  passwordError = '';
  confirmPasswordError = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  validateName(name: string) {
    if (!name) {
      this.nameError = 'El nombre es requerido';
    } else if (name.length < 2) {
      this.nameError = 'Mínimo 2 caracteres';
    } else {
      this.nameError = '';
    }
  }

  validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      this.emailError = 'El email es requerido';
    } else if (!emailRegex.test(email)) {
      this.emailError = 'Ingresa un email válido';
    } else {
      this.emailError = '';
    }
  }

  validateUsername(username: string) {
    if (!username) {
      this.usernameError = 'El username es requerido';
    } else if (username.length < 3) {
      this.usernameError = 'Mínimo 3 caracteres';
    } else {
      this.usernameError = '';
    }
  }

  validatePassword(password: string) {
    if (!password) {
      this.passwordError = 'La contraseña es requerida';
    } else if (password.length < 6) {
      this.passwordError = 'Mínimo 6 caracteres';
    } else {
      this.passwordError = '';
    }
  }

  validateConfirmPassword(confirm: string) {
    if (!confirm) {
      this.confirmPasswordError = 'Confirma tu contraseña';
    } else if (confirm !== this.password) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
    } else {
      this.confirmPasswordError = '';
    }
  }

  isFormValid(): boolean {
    return (
      !this.nameError &&
      !this.emailError &&
      !this.usernameError &&
      !this.passwordError &&
      !this.confirmPasswordError &&
      !!this.name &&
      !!this.email &&
      !!this.username &&
      !!this.password &&
      !!this.confirmPassword
    );
  }

  onRegister() {
    this.validateName(this.name);
    this.validateEmail(this.email);
    this.validateUsername(this.username);
    this.validatePassword(this.password);
    this.validateConfirmPassword(this.confirmPassword);

    if (!this.isFormValid()) {
      return;
    }

    this.loading.set(true);
    this.auth.register({
      name: this.name,
      email: this.email,
      username: this.username,
      password: this.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cuenta creada correctamente',
        });
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const errors = err.error?.message;
        const detail = Array.isArray(errors) ? errors.join(', ') : errors || 'Error al registrar usuario';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail,
        });
      },
    });
  }
}