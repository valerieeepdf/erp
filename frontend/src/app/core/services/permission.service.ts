import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private currentGroupId = signal<string>('');
  private currentPermissions = signal<string[]>([]);

  constructor(private auth: AuthService, private http: HttpClient) {}

  hasPermission(permission: string): boolean {
    return this.currentPermissions().includes(permission);
  }

  refreshPermissionsForGroup(groupId: string): void {
    this.currentGroupId.set(groupId);
    const user = this.auth.getUser();
    if (!user) return;

    // Primero carga del localStorage (inmediato)
    const permissionsByGroup = this.auth.getPermissionsByGroup();
    const localPermissions = permissionsByGroup[groupId] || [];
    this.currentPermissions.set(localPermissions);

    // Luego refresca desde el backend
    const headers = new HttpHeaders({ 'x-group-id': groupId });
    this.http.get<any>(`${API}/groups/user/${user.id}`, { headers }).subscribe({
      next: (res: any) => {
        const groups = res.data || [];
        const group = groups.find((g: any) => g.id === groupId);
        if (group) {
          const freshPermissions = group.permissions || [];
          this.currentPermissions.set(freshPermissions);

          // Actualizar localStorage
          const stored = this.auth.getPermissionsByGroup();
          stored[groupId] = freshPermissions;
          localStorage.setItem('erpjir_permissions', JSON.stringify(stored));
        }
      },
      error: () => {},
    });
  }

  getCurrentGroupId(): string {
    return this.currentGroupId();
  }

  getCurrentPermissions(): string[] {
    return this.currentPermissions();
  }

  setPermissions(permissions: string[]): void {
    this.currentPermissions.set(permissions);
  }
}