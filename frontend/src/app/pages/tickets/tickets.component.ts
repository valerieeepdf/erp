import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { UsersService } from '../../core/services/users.service';
import { TicketsService } from '../../core/services/tickets.service';
import { GroupsService } from '../../core/services/groups.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DragDropModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    TagModule,
    TooltipModule,
    TableModule,
    PaginatorModule,
    HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.css',
})
export class TicketsComponent implements OnInit {
  user = signal<any>(null);
  groups = signal<any[]>([]);
  selectedGroup = signal<any>(null);
  tickets = signal<any[]>([]);
  users = signal<any[]>([]);
  viewMode = signal<'kanban' | 'list'>('kanban');
  loading = signal(false);
  showDialog = signal(false);
  showConfirmDialog = signal(false);
  showEditDialog = signal(false);
  editingTicket = signal<any>(null);
  minDate = new Date().toISOString().slice(0, 16);

  todoTickets: any[] = [];
  inProgressTickets: any[] = [];
  doneTickets: any[] = [];

  todoId = 'todo-list';
 progressId = 'progress-list';
 doneId = 'done-list';

  filterStatus = '';
  filterPriority = '';
  filterAssigned = '';
  searchText = '';

  newTicket = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    assignedTo: '',
    dueDate: '',
  };

  editTicketForm = {
    title: '',
    description: '',
    priority: '',
    assignedTo: '',
  };

  priorities = [
    { label: 'Alta', value: 'HIGH' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Baja', value: 'LOW' },
  ];

  statuses = [
    { label: 'Por Hacer', value: 'TODO' },
    { label: 'En Progreso', value: 'IN_PROGRESS' },
    { label: 'Completado', value: 'DONE' },
  ];

  constructor(
    private ticketsService: TicketsService,
    private groupsService: GroupsService,
    private auth: AuthService,
    public permissionService: PermissionService,
    private messageService: MessageService,
    private router: Router,
    private usersService: UsersService,
  ) {}

  ngOnInit() {
    this.user.set(this.auth.getUser());
    this.loadGroups();
    this.loadUsers();
  }

  loadGroups() {
    const user = this.auth.getUser();
    if (!user) return;
    this.groupsService.getGroupsByUser(user.id).subscribe({
      next: (res: any) => {
        this.groups.set(res.data || []);
        if (res.data?.length > 0) {
          this.onGroupSelect(res.data[0]);
        }
      },
    });
  }

  loadUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (res: any) => this.users.set(res.data || []),
      error: () => {},
    });
  }

  onGroupSelect(group: any) {
    this.selectedGroup.set(group);
    this.permissionService.refreshPermissionsForGroup(group.id);
    this.loadTickets(group.id);
  }

  loadTickets(groupId: string) {
    this.loading.set(true);
    this.ticketsService.getTickets(groupId).subscribe({
      next: (res: any) => {
        const all = res.data || [];
        this.tickets.set(all);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters() {
  const all = this.tickets();
  const filtered = all.filter(t => {
    const matchStatus = this.filterStatus ? t.status === this.filterStatus : true;
    const matchPriority = this.filterPriority ? t.priority === this.filterPriority : true;
    const matchSearch = this.searchText ? t.title.toLowerCase().includes(this.searchText.toLowerCase()) : true;
    const matchAssigned = this.filterAssigned ? t.assignedTo === this.filterAssigned : true;
    return matchStatus && matchPriority && matchSearch && matchAssigned;
  });
  this.todoTickets = filtered.filter(t => t.status === 'TODO');
  this.inProgressTickets = filtered.filter(t => t.status === 'IN_PROGRESS');
  this.doneTickets = filtered.filter(t => t.status === 'DONE');
}

  onDrop(event: CdkDragDrop<any[]>, newStatus: string) {
  console.log('DROP EVENT FIRED:', event);
  console.log('newStatus:', newStatus);
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    const ticket = event.previousContainer.data[event.previousIndex];

    if (!this.canMoveTicket(ticket)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'No tienes permiso para mover este ticket',
      });
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    this.ticketsService.updateTicketStatus(ticket.id, newStatus).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado actualizado correctamente',
        });
      },
      error: () => {
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex,
        );
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo mover el ticket',
        });
      },
    });
  }
}

  canMoveTicket(ticket: any): boolean {
  return this.permissionService.hasPermission('tickets:move');
}

  get filteredTickets() {
  return this.tickets().filter(t => {
    const matchStatus = this.filterStatus ? t.status === this.filterStatus : true;
    const matchPriority = this.filterPriority ? t.priority === this.filterPriority : true;
    const matchSearch = this.searchText ? t.title.toLowerCase().includes(this.searchText.toLowerCase()) : true;
    const matchAssigned = this.filterAssigned ? t.assignedTo === this.filterAssigned : true;
    return matchStatus && matchPriority && matchSearch && matchAssigned;
  });
}

  openCreateDialog() {
    this.newTicket = {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assignedTo: '',
      dueDate: '',
    };
    this.showDialog.set(true);
  }

  isValidDate(date: string): boolean {
    if (!date) return true;
    const parts = date.split('T');
    return parts.length === 2 && parts[1] !== '' && parts[1] !== '00:00';
  }

  confirmCreate() {
    if (!this.newTicket.title) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'El título es requerido',
      });
      return;
    }

    if (!this.newTicket.dueDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La fecha límite es obligatoria',
      });
      return;
    }

    if (!this.isValidDate(this.newTicket.dueDate)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La fecha límite debe incluir fecha y hora',
      });
      return;
    }

    this.showConfirmDialog.set(true);
  }

  createTicket() {
    const dto: any = {
      title: this.newTicket.title,
      description: this.newTicket.description,
      priority: this.newTicket.priority,
      status: this.newTicket.status || 'TODO',
      groupId: this.selectedGroup().id,
    };

    if (this.newTicket.assignedTo) dto.assignedTo = this.newTicket.assignedTo;
    if (this.newTicket.dueDate) dto.dueDate = this.newTicket.dueDate;

    this.ticketsService.createTicket(dto).subscribe({
      next: () => {
        this.showDialog.set(false);
        this.showConfirmDialog.set(false);
        this.loadTickets(this.selectedGroup().id);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Ticket creado correctamente',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el ticket',
        });
      },
    });
  }

  openEditDialog(ticket: any) {
    this.editingTicket.set(ticket);
    this.editTicketForm = {
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority,
      assignedTo: ticket.assignedTo || '',
    };
    this.showEditDialog.set(true);
  }

  saveTicket() {
    this.ticketsService.updateTicket(this.editingTicket().id, this.editTicketForm).subscribe({
      next: () => {
        this.showEditDialog.set(false);
        this.loadTickets(this.selectedGroup().id);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Ticket actualizado correctamente',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el ticket',
        });
      },
    });
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
    };
    return colors[priority] || '#6b7280';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      HIGH: 'Alta',
      MEDIUM: 'Media',
      LOW: 'Baja',
    };
    return labels[priority] || priority;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      TODO: 'Por Hacer',
      IN_PROGRESS: 'En Progreso',
      DONE: 'Completado',
    };
    return labels[status] || status;
  }

  getTicketsByStatus(status: string): any[] {
    return this.tickets().filter(t => t.status === status);
  }

  getUserName(userId: string): string {
    if (!userId) return 'Sin asignar';
    const user = this.users().find(u => u.id === userId);
    return user ? user.name : 'Sin asignar';
  }

  getGroupName(groupId: string): string {
  const group = this.groups().find(g => g.id === groupId);
  return group ? group.name : this.selectedGroup()?.name || '-';
}

  moveTicket(ticket: any, newStatus: string) {
    if (!this.canMoveTicket(ticket)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'Solo puedes mover tickets asignados a ti con permiso tickets:move',
      });
      return;
    }
    this.ticketsService.updateTicketStatus(ticket.id, newStatus).subscribe({
      next: () => {
        this.loadTickets(this.selectedGroup().id);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado actualizado correctamente',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo mover el ticket',
        });
      },
    });
  }

  moveTicketFromList(ticket: any) {
    if (!this.canMoveTicket(ticket)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'Solo puedes mover tickets asignados a ti con permiso tickets:move',
      });
      return;
    }

    const newStatus = ticket.status === 'TODO' ? 'IN_PROGRESS' : 'DONE';
    this.ticketsService.updateTicketStatus(ticket.id, newStatus).subscribe({
      next: () => {
        this.loadTickets(this.selectedGroup().id);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado actualizado',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo mover el ticket',
        });
      },
    });
  }

  

  logout() {
    this.auth.logout();
  }

  getInitials(name: string): string {
    return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }
}