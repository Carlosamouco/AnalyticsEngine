import { NgModule, Injectable } from '@angular/core';
import { RouterModule, Routes, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

import { PageNotFoundComponent } from './page_not_found/page-not-found.component';
import { ListAppsComponent } from './list-apps/list-apps.component';
import { AppDetailsComponent } from './app-details/app-details.component';
import { AppOverviewComponent } from './app-overview/app-overview.component';
import { InvokeAppComponent } from './invoke-app/invoke-app.component';
import { ListEndpointsComponent } from './list-endpoints/list-endpoints.component';
import { EndpointDetailsComponent } from './endpoint-details/endpoint-details.component';

import { AppList } from './list-apps/list-apps.types';
import { ApplicationDetails } from './app-details/app-details.types';
import { Endpoint } from './list-endpoints/list-endpoints.types';


@Injectable()
export class AppListResolver implements Resolve<AppList[]> {
  constructor(private http: HttpClient) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<AppList[]>('/api/applications');
  }
}

@Injectable()
export class AppVersionDetailsResolver implements Resolve<ApplicationDetails> {
  constructor(private http: HttpClient, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<ApplicationDetails>(`/api/application/${route.params['appId']}/${route.params['versionId']}`)
      .catch(() => {
        return Observable.of(null);
      });
  }
}

@Injectable()
export class AppOverviewResolver implements Resolve<ApplicationDetails> {
  constructor(private http: HttpClient, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<ApplicationDetails>(`/api/application/${route.params['appId']}`)
      .catch(() => {
        return Observable.of(null);
      });
  }
}

@Injectable()
export class EndpointsResolver implements Resolve<Endpoint[]> {
  constructor(private http: HttpClient) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<Endpoint[]>('/api/endpoints');
  }
}

@Injectable()
export class EndpointResolver implements Resolve<Endpoint> {
  constructor(private http: HttpClient) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get<Endpoint>(`/api/endpoint/${route.params['endpointId']}`);
  }
}

const routes: Routes = [
  { path: '', redirectTo: '/apps', pathMatch: 'full' },
  { path: 'invoke/:appId/:versionId', component: InvokeAppComponent, resolve: { apps: AppVersionDetailsResolver } },
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
    EndpointResolver
  ],
  declarations: []
})
export class AppRoutingModule { }
