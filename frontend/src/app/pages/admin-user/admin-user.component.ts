import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UsersService } from '../../core/services/users.service';
import { GroupsService } from '../../core/services/groups.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './admin-user.component.html',
  styleUrl: './admin-user.component.css',
})
export class AdminUserComponent implements OnInit {
  user = signal<any>(null);
  users = signal<any[]>([]);
  groups = signal<any[]>([]);
  showEditDialog = signal(false);
  showPermissionsDialog = signal(false);
  editingUser = signal<any>(null);
  selectedUserForPerms = signal<any>(null);

  editForm = { name: '', email: '', username: '' };

  availablePermissions = [
    'tickets:add',
    'tickets:move',
    'groups:manage',
    'users:manage',
  ];

  selectedGroupId = '';
  selectedPermissions: string[] = [];

  permissionLabels: Record<string, string> = {
  'tickets:add': 'Crear tickets',
  'tickets:move': 'Mover tickets',
  'groups:manage': 'Administrar grupos',
  'users:manage': 'Administrar usuarios',
};

getPermissionLabel(key: string): string {
  return this.permissionLabels[key] || key;
}

  constructor(
    private usersService: UsersService,
    private groupsService: GroupsService,
    private auth: AuthService,
    public permissionService: PermissionService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.user.set(this.auth.getUser());
    this.loadUsers();
    this.loadGroups();
    const stored = this.auth.getPermissionsByGroup();
    const groupId = Object.keys(stored)[0];
    if (groupId) this.permissionService.refreshPermissionsForGroup(groupId);
  }

  loadUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (res: any) => this.users.set(res.data || []),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios',
        });
      },
    });
  }

  loadGroups() {
    this.groupsService.getAllGroups().subscribe({
      next: (res: any) => this.groups.set(res.data || []),
      error: () => {},
    });
  }

  openEditDialog(u: any) {
    this.editingUser.set(u);
    this.editForm = { name: u.name, email: u.email, username: u.username };
    this.showEditDialog.set(true);
  }

  saveUser() {
    if (!this.editForm.name || !this.editForm.email || !this.editForm.username) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Todos los campos son requeridos',
      });
      return;
    }

    this.usersService.updateUser(this.editingUser().id, this.editForm).subscribe({
      next: () => {
        this.showEditDialog.set(false);
        this.loadUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario actualizado correctamente',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el usuario',
        });
      },
    });
  }

  openPermissionsDialog(u: any) {
    this.selectedUserForPerms.set(u);
    this.selectedGroupId = '';
    this.selectedPermissions = [];
    this.showPermissionsDialog.set(true);
  }

  onGroupSelectForPerms(groupId: string) {
    this.selectedGroupId = groupId;
    const user = this.selectedUserForPerms();
    const member = user?.groupMembers?.find((m: any) => m.groupId === groupId);
    this.selectedPermissions = member ? [...member.permissions] : [];
  }

  togglePermission(permission: string) {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions = [...this.selectedPermissions, permission];
    }
  }

  savePermissions() {
    if (!this.selectedGroupId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Selecciona un grupo',
      });
      return;
    }

    this.groupsService.assignUserToGroup({
      userId: this.selectedUserForPerms().id,
      groupId: this.selectedGroupId,
      permissions: this.selectedPermissions,
    }).subscribe({
      next: () => {
        this.showPermissionsDialog.set(false);
        this.loadUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Permisos actualizados correctamente',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron actualizar los permisos',
        });
      },
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }

  getGroupName(groupId: string): string {
  const group = this.groups().find(g => g.id === groupId);
  return group ? group.name : 'Grupo desconocido';
}

searchText = '';
currentPage = 0;
rowsPerPage = 5;

get filteredUsers() {
  return this.users().filter(u => {
    const search = this.searchText.toLowerCase();
    return (
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.username?.toLowerCase().includes(search)
    );
  });
}

refreshUsers() {
  this.loadUsers();
  this.loadGroups();
}
  logout() {
    this.auth.logout();
  }
}