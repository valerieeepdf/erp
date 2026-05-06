import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  getAllUsers() {
    return this.http.get<any>(`${API}/users`);
  }

  getUserById(id: string) {
    return this.http.get<any>(`${API}/users/${id}`);
  }

  updateUser(id: string, dto: { name?: string; email?: string; username?: string }) {
    return this.http.patch<any>(`${API}/users/${id}`, dto);
  }
}