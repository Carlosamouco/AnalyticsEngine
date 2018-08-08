import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';

import { AppDetailsModule } from './app-details/app-details.module';
import { ListAppsModule } from './list-apps/list-apps.module';
import { AppOverviewModule } from './app-overview/app-overview.module';
import { InvokeAppModule } from './invoke-app/invoke-app.module';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './/app-routing.module';
import { PageNotFoundComponent } from './page_not_found/page-not-found.component';
import { ListEndpointsModule } from './list-endpoints/list-endpoints.module';
import { EndpointDetailsComponent } from './endpoint-details/endpoint-details.component';
import { LoginComponent } from './login/login.component';

import { AuthService } from './auth.service';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    EndpointDetailsComponent,
    LoginComponent,
    RegisterComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    TypeaheadModule.forRoot(),
    PopoverModule.forRoot(),
    AppDetailsModule,
    AppOverviewModule,
    InvokeAppModule,
    ListAppsModule,
    ListEndpointsModule
  ],
  providers: [
   {
     provide: HTTP_INTERCEPTORS,
     useClass: AuthService,
     multi: true
   }
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
