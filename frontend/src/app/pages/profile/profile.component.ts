import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { PermissionService } from '../../core/services/permission.service';
import { TicketsService } from '../../core/services/tickets.service';
import { GroupsService } from '../../core/services/groups.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  user = signal<any>(null);
  loading = signal(false);
  myTickets = signal<any[]>([]);
  myGroups = signal<any[]>([]);
  showEditForm = false;

  form = { name: '', email: '', username: '' };

  permissionDetails = [
    { module: 'Tickets', permission: 'tickets:add', label: 'Crear tickets' },
    { module: 'Tickets', permission: 'tickets:move', label: 'Mover tickets' },
    { module: 'Grupos', permission: 'groups:manage', label: 'Administrar grupos' },
    { module: 'Usuarios', permission: 'users:manage', label: 'Administrar usuarios' },
  ];

  constructor(
    private auth: AuthService,
    private usersService: UsersService,
    public permissionService: PermissionService,
    private ticketsService: TicketsService,
    private groupsService: GroupsService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
  const u = this.auth.getUser();
  this.user.set(u);
  this.form = { name: u?.name || '', email: u?.email || '', username: u?.username || '' };

  // Usar el grupo activo del permissionService
  const activeGroupId = this.permissionService.getCurrentGroupId();
  
  if (activeGroupId) {
    this.permissionService.refreshPermissionsForGroup(activeGroupId);
  }

  this.loadMyGroups();
}

loadMyGroups() {
  const u = this.auth.getUser();
  if (!u) return;
  this.groupsService.getGroupsByUser(u.id).subscribe({
    next: (res: any) => {
      this.myGroups.set(res.data || []);
      if (res.data?.length > 0) {
        // Usar el grupo activo si existe, si no el primero
        const activeGroupId = this.permissionService.getCurrentGroupId();
        const activeGroup = res.data.find((g: any) => g.id === activeGroupId) || res.data[0];
        this.permissionService.refreshPermissionsForGroup(activeGroup.id);
        this.loadMyTickets(activeGroup.id);
      }
    },
  });
}

  loadMyTickets(groupId: string) {
    this.ticketsService.getTickets(groupId).subscribe({
      next: (res: any) => {
        const userId = this.auth.getUser()?.id;
        const all = res.data || [];
        this.myTickets.set(all.filter((t: any) => t.assignedTo === userId).slice(0, 5));
      },
    });
  }

  saveProfile() {
    if (!this.form.name || !this.form.email || !this.form.username) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Todos los campos son requeridos',
      });
      return;
    }

    this.loading.set(true);
    this.usersService.updateUser(this.user().id, this.form).subscribe({
      next: () => {
        this.loading.set(false);
        this.showEditForm = false;
        localStorage.setItem('erpjir_user', JSON.stringify({ ...this.user(), ...this.form }));
        this.user.set({ ...this.user(), ...this.form });
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado correctamente',
        });
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el perfil',
        });
      },
    });
  }

  getGroupNames(): string {
    return this.myGroups().map(g => g.name).join(', ') || 'Sin grupos';
  }

  hasPermission(perm: string): boolean {
    return this.permissionService.getCurrentPermissions().includes(perm);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'TODO': 'Por Hacer',
      'IN_PROGRESS': 'En progreso',
      'DONE': 'Hecho',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'TODO': 'status-todo',
      'IN_PROGRESS': 'status-progress',
      'DONE': 'status-done',
    };
    return classes[status] || '';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'HIGH': 'Alta',
      'MEDIUM': 'Media',
      'LOW': 'Baja',
    };
    return labels[priority] || priority;
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'HIGH': 'priority-high',
      'MEDIUM': 'priority-medium',
      'LOW': 'priority-low',
    };
    return classes[priority] || '';
  }

  getInitials(name: string): string {
    return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }

  logout() {
    this.auth.logout();
  }
}