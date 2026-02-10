import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { delay } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

// Usuários de teste pré-registrados
const mockUsers: { [email: string]: any } = {
  'test@example.com': {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  },
};

// Token de teste
const mockToken = 'mock-jwt-token-' + Date.now();

export const mockAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Apenas interceptar requisições de autenticação
  if (req.url.includes('/api/auth/')) {
    console.log('[Mock Auth] Interceptando:', req.method, req.url);

    if (req.url.includes('/login') && req.method === 'POST') {
      const { email, password } = req.body as { email: string; password: string };
      console.log('[Mock Auth] Login attempt:', email);

      // Verificar credenciais de teste
      if (email === 'test@example.com' && password === 'password123') {
        const response = {
          token: mockToken,
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
        };
        console.log('[Mock Auth] ✅ Login bem-sucedido');
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        return of(new HttpResponse({ status: 200, body: response })).pipe(delay(500));
      } else {
        console.log('[Mock Auth] ❌ Credenciais inválidas');
        const errorResponse = new HttpErrorResponse({
          error: { message: 'Email ou senha inválidos' },
          status: 401,
          statusText: 'Unauthorized',
          url: req.url,
        });
        return throwError(() => errorResponse).pipe(delay(500));
      }
    }

    if (req.url.includes('/register') && req.method === 'POST') {
      const { name, email, password } = req.body as {
        name: string;
        email: string;
        password: string;
      };
      console.log('[Mock Auth] Registro attempt:', email);

      // Verificar se email já existe
      if (mockUsers[email]) {
        console.log('[Mock Auth] ❌ Email já registrado');
        const errorResponse = new HttpErrorResponse({
          error: { message: 'Email já registrado' },
          status: 400,
          statusText: 'Bad Request',
          url: req.url,
        });
        return throwError(() => errorResponse).pipe(delay(500));
      }

      // Registrar novo usuário
      const newUser = { id: Date.now().toString(), name, email, password };
      mockUsers[email] = newUser;

      const response = {
        token: mockToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      };

      console.log('[Mock Auth] ✅ Novo usuário registrado:', email);
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      return of(new HttpResponse({ status: 201, body: response })).pipe(delay(500));
    }
  }

  // Deixar outras requisições passarem
  return next(req);
};
