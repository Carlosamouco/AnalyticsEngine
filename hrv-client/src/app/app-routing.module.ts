import { NgModule, Injectable } from '@angular/core';
import { RouterModule, Routes, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

import { InvokeAppComponent } from './invoke-app/invoke-app.component';

import { TesteComponent } from './teste/teste.component';
import { ApplicationDetails } from './invoke-app/invoke-app.types';

@Injectable()
export class AppDetailsResolver implements Resolve<ApplicationDetails> {
  constructor(private http: HttpClient, private router: Router) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.http.get('/api/applications', { params: { q: 'HRV' } })
      .catch(() => {
        return Observable.of(null);
      });
  }
}

const routes: Routes = [
  { path: '', component: InvokeAppComponent, resolve: { apps: AppDetailsResolver } },
  { path: 'test', component: TesteComponent, resolve: { apps: AppDetailsResolver } },
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
  ],
  declarations: []
})
export class AppRoutingModule { }
