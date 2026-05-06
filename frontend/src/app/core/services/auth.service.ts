import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { tap } from 'rxjs';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'erpjir_token';
  private userKey = 'erpjir_user';
  private permissionsKey = 'erpjir_permissions';

  currentUser = signal<any>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService,
  ) {
    const user = localStorage.getItem(this.userKey);
    if (user) this.currentUser.set(JSON.parse(user));
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${API}/auth/login`, { username, password }).pipe(
      tap(res => {
        const data = res.data[0];
        // Guardar token en cookie
        this.cookieService.set(this.tokenKey, data.token, {
          expires: 1,
          path: '/',
          sameSite: 'Strict',
        });
        // Guardar user y permisos en localStorage
        localStorage.setItem(this.userKey, JSON.stringify(data.user));
        localStorage.setItem(this.permissionsKey, JSON.stringify(data.permissionsByGroup));
        this.currentUser.set(data.user);
      }),
    );
  }

  register(dto: { name: string; email: string; username: string; password: string }) {
    return this.http.post<any>(`${API}/auth/register`, dto);
  }

  logout() {
    this.cookieService.delete(this.tokenKey, '/');
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.permissionsKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.cookieService.get(this.tokenKey) || null;
  }

  isAuthenticated(): boolean {
  const token = this.getToken();
  console.log('isAuthenticated:', !!token);
  return !!token;
}

  getPermissionsByGroup(): Record<string, string[]> {
    const p = localStorage.getItem(this.permissionsKey);
    return p ? JSON.parse(p) : {};
  }

  getUser() {
    const u = localStorage.getItem(this.userKey);
    return u ? JSON.parse(u) : null;
  }
}