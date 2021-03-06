import { NgModule, Injectable } from '@angular/core';
import {
  RouterModule, Routes, Resolve, ActivatedRouteSnapshot, Router, CanActivate
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PageNotFoundComponent } from './page_not_found/page-not-found.component';
import { ListAppsComponent } from './list-apps/list-apps.component';
import { AppDetailsComponent } from './app-details/app-details.component';
import { AppOverviewComponent } from './app-overview/app-overview.component';
import { InvokeAppComponent } from './invoke-app/invoke-app.component';
import { ListEndpointsComponent } from './list-endpoints/list-endpoints.component';
import { EndpointDetailsComponent } from './endpoint-details/endpoint-details.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

import { AppList } from './list-apps/list-apps.types';
import { ApplicationDetails } from './app-details/app-details.types';
import { Endpoint } from './list-endpoints/list-endpoints.types';

import { AuthService } from './auth.service';


@Injectable()
export class AppListResolver implements Resolve<AppList[]> {
  constructor(private http: HttpClient) { }

  resolve(): Observable<any> | Promise<any> | any {
    return this.http.get<AppList[]>('/api/applications');
  }
}

@Injectable()
export class AppVersionDetailsResolver implements Resolve<ApplicationDetails> {
  constructor(private http: HttpClient, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<ApplicationDetails>(`/api/application/${route.params['appId']}/${route.params['versionId']}`)
      .pipe(catchError(() => of(null)));
  }
}

@Injectable()
export class AppOverviewResolver implements Resolve<ApplicationDetails> {
  constructor(private http: HttpClient, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<ApplicationDetails>(`/api/application/${route.params['appId']}`)
      .pipe(catchError(() => of(null)));
  }
}

@Injectable()
export class EndpointsResolver implements Resolve<Endpoint[]> {
  constructor(private http: HttpClient) { }

  resolve(): Observable<any> | Promise<any> | any {
    return this.http.get<Endpoint[]>('/api/endpoints');
  }
}

@Injectable()
export class EndpointResolver implements Resolve<Endpoint> {
  constructor(private http: HttpClient) { }

  resolve(
    route: ActivatedRouteSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<Endpoint>(`/api/endpoint/${route.params['endpointId']}`);
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot) {
    if (route.url[0].path === 'login') {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
      }
      return true;
    }

    return this.auth.isAuthenticated();
  }
}

const routes: Routes = [
  { path: '', redirectTo: '/apps', pathMatch: 'full' },
  { path: 'login', canActivate: [AuthGuard], component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'invoke/:appId/:versionId',
    component: InvokeAppComponent,
    data: { skipLogin: true },
    canActivate: [AuthGuard],
    resolve: { apps: AppVersionDetailsResolver }
  },
  { path: 'apps', component: ListAppsComponent, resolve: { apps: AppListResolver } },
  { path: 'endpoints', component: ListEndpointsComponent, resolve: { endpoints: EndpointsResolver } },
  { path: 'app/:appId', component: AppOverviewComponent, resolve: { app: AppOverviewResolver } },
  { path: 'endpoint/:endpointId', component: EndpointDetailsComponent, resolve: { endpoint: EndpointResolver } },
  {
    path: 'app/:appId/:versionId',
    component: AppDetailsComponent,
    resolve: {
      app: AppVersionDetailsResolver,
      endpoints: EndpointsResolver
    }
  },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    AppListResolver,
    AppOverviewResolver,
    AppVersionDetailsResolver,
    EndpointsResolver,
    EndpointResolver,
    AuthGuard
  ],
  declarations: []
})
export class AppRoutingModule { }
