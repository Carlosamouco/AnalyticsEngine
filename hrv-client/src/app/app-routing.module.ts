import { NgModule, Injectable } from '@angular/core';
import { RouterModule, Routes, Resolve, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { InvokeAppComponent } from './invoke-app/invoke-app.component';

import { ApplicationDetails } from './invoke-app/invoke-app.types';

@Injectable()
export class AppDetailsResolver implements Resolve<ApplicationDetails> {
  constructor(private http: HttpClient, private router: Router) { }

  resolve(
  ): Observable<any> | Promise<any> | any {
    return this.http.get('/api/applications', { params: { q: 'HRV' } })
      .catch((err) => {
        return Observable.of(null);
      });
  }
}

const routes: Routes = [
  { path: '', component: InvokeAppComponent, resolve: { apps: AppDetailsResolver } },
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
