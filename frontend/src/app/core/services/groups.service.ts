import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PermissionService } from './permission.service';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class GroupsService {
  constructor(
    private http: HttpClient,
    private permissionService: PermissionService,
  ) {}

  private getGroupHeaders() {
    const groupId = this.permissionService.getCurrentGroupId();
    return new HttpHeaders({ 'x-group-id': groupId });
  }

  getAllGroups() {
    return this.http.get<any>(`${API}/groups`, {
      headers: this.getGroupHeaders(),
    });
  }

  getGroupsByUser(userId: string) {
    return this.http.get<any>(`${API}/groups/user/${userId}`, {
      headers: this.getGroupHeaders(),
    });
  }

  createGroup(dto: { name: string; description?: string }) {
    return this.http.post<any>(`${API}/groups`, dto, {
      headers: this.getGroupHeaders(),
    });
  }

  updateGroup(id: string, dto: { name?: string; description?: string }) {
    return this.http.patch<any>(`${API}/groups/${id}`, dto, {
      headers: this.getGroupHeaders(),
    });
  }

  deleteGroup(id: string) {
    return this.http.delete<any>(`${API}/groups/${id}`, {
      headers: this.getGroupHeaders(),
    });
  }

  assignUserToGroup(dto: { userId: string; groupId: string; permissions: string[] }) {
    return this.http.post<any>(`${API}/groups/assign`, dto, {
      headers: this.getGroupHeaders(),
    });
  }
}