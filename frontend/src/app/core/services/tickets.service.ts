import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PermissionService } from './permission.service';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  constructor(
    private http: HttpClient,
    private permissionService: PermissionService,
  ) {}

  private getGroupHeaders() {
    const groupId = this.permissionService.getCurrentGroupId();
    return new HttpHeaders({ 'x-group-id': groupId });
  }

  getTickets(groupId?: string) {
  const params: Record<string, string> = {};
  if (groupId) params['groupId'] = groupId;
  return this.http.get<any>(`${API}/tickets`, {
    headers: this.getGroupHeaders(),
    params,
  });
}

  getTicket(id: string) {
    return this.http.get<any>(`${API}/tickets/${id}`, {
      headers: this.getGroupHeaders(),
    });
  }

  createTicket(dto: {
    title: string;
    description?: string;
    priority: string;
    groupId: string;
    assignedTo?: string;
  }) {
    return this.http.post<any>(`${API}/tickets`, dto, {
      headers: this.getGroupHeaders(),
    });
  }

  updateTicketStatus(id: string, status: string) {
    return this.http.patch<any>(
      `${API}/tickets/${id}/status`,
      { status },
      { headers: this.getGroupHeaders() },
    );
  }

  updateTicket(id: string, dto: any) {
    return this.http.patch<any>(`${API}/tickets/${id}`, dto, {
      headers: this.getGroupHeaders(),
    });
  }

  deleteTicket(id: string) {
    return this.http.delete<any>(`${API}/tickets/${id}`, {
      headers: this.getGroupHeaders(),
    });
  }
}