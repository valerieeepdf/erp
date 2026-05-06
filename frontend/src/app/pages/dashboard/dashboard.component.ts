import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { GroupsService } from '../../core/services/groups.service';
import { TicketsService } from '../../core/services/tickets.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    ChartModule,
    ToastModule,
    AvatarModule,
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  user = signal<any>(null);
  groups = signal<any[]>([]);
  selectedGroup = signal<any>(null);
  tickets = signal<any[]>([]);
  loading = signal(false);
  today = new Date();
  completionRate = signal(0);
  recentTickets = signal<any[]>([]);
  myTickets = signal<any[]>([]);
  completionChartData: any = null;

  stats = signal({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  statusChartData: any = null;
  priorityChartData: any = null;
  groupChartData: any = null;
  chartOptions: any = null;
  pieOptions: any = null;

  constructor(
    private auth: AuthService,
    private groupsService: GroupsService,
    private ticketsService: TicketsService,
    public permissionService: PermissionService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.user.set(this.auth.getUser());
    this.initChartOptions();
    this.buildCharts([]);
    this.loadGroups();
  }

  initChartOptions() {
    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } },
      },
    };
    this.pieOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } },
      },
    };
  }

  loadGroups() {
    const user = this.auth.getUser();
    if (!user) return;
    this.groupsService.getGroupsByUser(user.id).subscribe({
      next: (res: any) => {
        this.groups.set(res.data || []);
        if (res.data?.length > 0) {
          const savedGroupId = localStorage.getItem('erpjir_active_group');
          const activeGroup = res.data.find((g: any) => g.id === savedGroupId) || res.data[0];
          this.onGroupSelect(activeGroup);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los grupos',
        });
      },
    });
  }

  onGroupSelect(group: any) {
  this.selectedGroup.set(group);
  localStorage.setItem('erpjir_active_group', group.id);
  
  // Cargar permisos frescos del backend y luego cargar tickets
  const user = this.auth.getUser();
  if (!user) return;
  
  this.groupsService.getGroupsByUser(user.id).subscribe({
    next: (res: any) => {
      const groups = res.data || [];
      const activeGroup = groups.find((g: any) => g.id === group.id);
      if (activeGroup) {
        const freshPermissions = activeGroup.permissions || [];
        this.permissionService.setPermissions(freshPermissions);
        // Actualizar localStorage
        const stored = this.auth.getPermissionsByGroup();
        stored[group.id] = freshPermissions;
        localStorage.setItem('erpjir_permissions', JSON.stringify(stored));
      }
      // Ahora cargar tickets con permisos actualizados
      this.loadTickets(group.id);
    },
    error: () => {
      this.loadTickets(group.id);
    },
  });
}

  onGroupSelectById(event: any) {
    const groupId = event.target.value;
    const group = this.groups().find(g => g.id === groupId);
    if (group) {
      this.onGroupSelect(group);
    }
  }

  loadTickets(groupId: string) {
    this.loading.set(true);
    this.ticketsService.getTickets(groupId).subscribe({
      next: (res: any) => {
        const tickets = res.data || [];
        this.tickets.set(tickets);
        this.calculateStats(tickets);
        this.buildCharts(tickets);
        if (this.groups().length > 1) {
          this.buildGroupChart();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  calculateStats(tickets: any[]) {
    const total = tickets.length;
    const done = tickets.filter(t => t.status === 'DONE').length;
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const todo = tickets.filter(t => t.status === 'TODO').length;
    const high = tickets.filter(t => t.priority === 'HIGH').length;
    const medium = tickets.filter(t => t.priority === 'MEDIUM').length;
    const low = tickets.filter(t => t.priority === 'LOW').length;

    this.stats.set({ total, todo, inProgress, done, high, medium, low });

    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    this.completionRate.set(rate);

    const userId = this.auth.getUser()?.id;
    this.myTickets.set(tickets.filter(t => t.assignedTo === userId).slice(0, 4));
    this.recentTickets.set([...tickets].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5));
  }

  buildCharts(tickets: any[]) {
    const s = this.stats();

    this.statusChartData = {
      labels: ['Por Hacer', 'En Progreso', 'Completado'],
      datasets: [{
        data: [s.todo, s.inProgress, s.done],
        backgroundColor: ['#e5e7eb', '#f59e0b', '#10b981'],
        borderWidth: 0,
      }],
    };

    this.priorityChartData = {
      labels: ['Alta', 'Media', 'Baja'],
      datasets: [{
        label: 'Tickets',
        data: [s.high, s.medium, s.low],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderRadius: 8,
        borderWidth: 0,
      }],
    };

    const rate = this.completionRate();
    this.completionChartData = {
      labels: ['Completado', 'Restante'],
      datasets: [{
        data: [rate, 100 - rate],
        backgroundColor: ['#7c3aed', '#e5e7eb'],
        borderWidth: 0,
      }],
    };
  }

  buildGroupChart() {
  const labels = this.groups().map(g => g.name);
  const user = this.auth.getUser();
  if (!user) return;

  // Para cada grupo, obtener sus permisos frescos y luego sus tickets
  const promises = this.groups().map(async (g: any) => {
    // Usar los permisos que ya tenemos del grupo (los que vienen de getGroupsByUser)
    const groupPermissions = g.permissions || [];
    this.permissionService.setPermissions(groupPermissions);
    
    try {
      const res: any = await this.ticketsService.getTickets(g.id).toPromise();
      return res?.data?.length || 0;
    } catch {
      return 0;
    }
  });

  Promise.all(promises).then(counts => {
    // Restaurar permisos del grupo activo
    const activeGroup = this.selectedGroup();
    if (activeGroup) {
      const activePermissions = activeGroup.permissions || [];
      this.permissionService.setPermissions(activePermissions);
    }

    this.groupChartData = {
      labels,
      datasets: [{
        label: 'Tickets por grupo',
        data: counts,
        backgroundColor: ['#7c3aed', '#F54927', '#10b981', '#f59e0b', '#3b82f6'],
        borderRadius: 8,
        borderWidth: 0,
      }],
    };
  });
}
  goToTickets() {
    if (!this.selectedGroup()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Selecciona un grupo primero',
      });
      return;
    }
    this.router.navigate(['/tickets']);
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'TODO': 'status-todo',
      'IN_PROGRESS': 'status-progress',
      'DONE': 'status-done',
    };
    return classes[status] || '';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'TODO': 'pi-circle',
      'IN_PROGRESS': 'pi-spin pi-spinner',
      'DONE': 'pi-check-circle',
    };
    return icons[status] || 'pi-circle';
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'HIGH': 'priority-high',
      'MEDIUM': 'priority-medium',
      'LOW': 'priority-low',
    };
    return classes[priority] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'TODO': 'Por Hacer',
      'IN_PROGRESS': 'En Progreso',
      'DONE': 'Completado',
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'HIGH': 'Alta',
      'MEDIUM': 'Media',
      'LOW': 'Baja',
    };
    return labels[priority] || priority;
  }

  logout() {
    this.auth.logout();
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }
}