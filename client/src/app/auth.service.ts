import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements HttpInterceptor {

  private token: string;
  private role: string;

  constructor() { }

  public saveSession(token: string, role: string) {
    this.token = token;
    this.role = role;

    localStorage.setItem('Authorization', token);
    localStorage.setItem('Role', role);
  }

  public destroySession() {
    localStorage.removeItem('Role');
    localStorage.removeItem('Authorization');

    this.role = null;
    this.token = null;
  }

  public getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('Authorization');
      return this.token;
    }
    return this.token;
  }

  public getRole() {
    if (!this.role) {
      this.role = localStorage.getItem('Role');
      return this.role;
    }
    return this.role;
  }

  public isAuthenticated(adminOnly?: boolean): boolean {
    return adminOnly ? (this.getRole() === '0' || this.getRole() === '1') && !!this.getToken() : !!this.getToken();
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(req);
  }
}
