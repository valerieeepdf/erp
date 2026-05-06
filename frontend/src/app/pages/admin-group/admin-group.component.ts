import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { GroupsService } from '../../core/services/groups.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { UsersService } from '../../core/services/users.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-admin-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ChipModule,
    ConfirmDialogModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-group.component.html',
  styleUrl: './admin-group.component.css',
})
export class AdminGroupComponent implements OnInit {
  user = signal<any>(null);
  groups = signal<any[]>([]);
  users = signal<any[]>([]);
  showGroupDialog = signal(false);
  showAssignDialog = signal(false);
  showMembersDialog = signal(false);
  editingGroup = signal<any>(null);
  selectedGroupForMembers = signal<any>(null);

  groupForm = { name: '', description: '' };
  assignForm = { userId: '', groupId: '', permissions: '' };
  selectedPermissions: string[] = [];

  availablePermissions = [
    { key: 'tickets:add', label: 'Crear tickets' },
    { key: 'tickets:move', label: 'Mover tickets' },
    { key: 'groups:manage', label: 'Administrar grupos' },
    { key: 'users:manage', label: 'Administrar usuarios' },
  ];

  permissionLabels: Record<string, string> = {
    'tickets:add': 'Crear tickets',
    'tickets:move': 'Mover tickets',
    'groups:manage': 'Administrar grupos',
    'users:manage': 'Administrar usuarios',
  };

  constructor(
    private groupsService: GroupsService,
    private auth: AuthService,
    public permissionService: PermissionService,
    private usersService: UsersService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.user.set(this.auth.getUser());
    this.loadGroups();
    this.loadUsers();
    const stored = this.auth.getPermissionsByGroup();
    const groupId = Object.keys(stored)[0];
    if (groupId) this.permissionService.refreshPermissionsForGroup(groupId);
  }

  loadGroups() {
    this.groupsService.getAllGroups().subscribe({
      next: (res: any) => this.groups.set(res.data || []),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los grupos',
        });
      },
    });
  }

  loadUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (res: any) => this.users.set(res.data || []),
      error: () => {},
    });
  }

  getUserName(userId: string): string {
    const user = this.users().find(u => u.id === userId);
    return user ? user.name : 'Usuario desconocido';
  }

  getUserUsername(userId: string): string {
    const user = this.users().find(u => u.id === userId);
    return user ? '@' + user.username : '';
  }

  getPermissionLabel(key: string): string {
    return this.permissionLabels[key] || key;
  }

  getInitials(name: string): string {
    return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }

  openCreateDialog() {
    this.editingGroup.set(null);
    this.groupForm = { name: '', description: '' };
    this.showGroupDialog.set(true);
  }

  openEditDialog(group: any) {
    this.editingGroup.set(group);
    this.groupForm = { name: group.name, description: group.description || '' };
    this.showGroupDialog.set(true);
  }

  openAssignDialog(group: any) {
    this.assignForm = { userId: '', groupId: group.id, permissions: '' };
    this.selectedPermissions = [];
    this.showAssignDialog.set(true);
  }

  openMembersDialog(group: any) {
    this.selectedGroupForMembers.set(group);
    this.showMembersDialog.set(true);
  }

  togglePermission(key: string) {
    if (this.selectedPermissions.includes(key)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== key);
    } else {
      this.selectedPermissions = [...this.selectedPermissions, key];
    }
  }

  saveGroup() {
    if (!this.groupForm.name) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'El nombre es requerido',
      });
      return;
    }

    const dto = {
      name: this.groupForm.name,
      description: this.groupForm.description || undefined,
    };

    if (this.editingGroup()) {
      this.groupsService.updateGroup(this.editingGroup().id, dto).subscribe({
        next: () => {
          this.showGroupDialog.set(false);
          this.loadGroups();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo actualizado' });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
        },
      });
    } else {
      this.groupsService.createGroup(dto).subscribe({
        next: () => {
          this.showGroupDialog.set(false);
          this.loadGroups();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo creado' });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' });
        },
      });
    }
  }

  confirmDeleteGroup(group: any) {
    if (group.members?.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No permitido',
        detail: `No puedes eliminar "${group.name}" porque tiene ${group.members.length} usuario(s) asignado(s). Desasígnalos primero.`,
        life: 5000,
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el grupo "${group.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.groupsService.deleteGroup(group.id).subscribe({
          next: () => {
            this.loadGroups();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo eliminado' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
          },
        });
      },
    });
  }

  assignUser() {
    if (!this.assignForm.userId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Selecciona un usuario' });
      return;
    }

    if (this.selectedPermissions.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Selecciona al menos un permiso' });
      return;
    }

    this.groupsService.assignUserToGroup({
      userId: this.assignForm.userId,
      groupId: this.assignForm.groupId,
      permissions: this.selectedPermissions,
    }).subscribe({
      next: () => {
        this.showAssignDialog.set(false);
        this.loadGroups();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario asignado correctamente' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar el usuario' });
      },
    });
  }

  logout() {
    this.auth.logout();
  }
}