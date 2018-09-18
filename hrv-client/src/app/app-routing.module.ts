import { NgModule, Injectable } from '@angular/core';
import { RouterModule, Routes, Resolve, Router, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { InvokeAppComponent } from './invoke-app/invoke-app.component';
import { LoginComponent } from './login/login.component';
import { ApplicationDetails } from './invoke-app/invoke-app.types';
import { AuthService } from './auth.service';

@Injectable()
export class AppDetailsResolver implements Resolve<ApplicationDetails> {
  constructor(private http: HttpClient, private router: Router) { }

  resolve(
  ): Observable<any> | Promise<any> | any {
    return this.http.get('/api/applications', { params: { q: 'HRV' } })
      .pipe(catchError(() => of(null)));
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot) {
    if (!route.url[0]) {
      if (!this.auth.isAuthenticated()) {
        this.router.navigate(['login']);
      }
      return true;
    } else if (route.url[0].path === 'login') {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
      }
      return true;
    }

    return this.auth.isAuthenticated();
  }
}

const routes: Routes = [
  { path: '', canActivate: [AuthGuard], component: InvokeAppComponent, resolve: { apps: AppDetailsResolver } },
  { path: 'login', canActivate: [AuthGuard], component: LoginComponent },
  { path: '**', component: InvokeAppComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    AppDetailsResolver,
    AuthGuard
  ],
  declarations: []
})
export class AppRoutingModule { }
