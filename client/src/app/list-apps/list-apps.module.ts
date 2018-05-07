import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';

import { ListAppsComponent } from './list-apps.component';
import { CreateAppComponent } from './create-app/create-app.component';
import { DeleteAppComponent } from './delete-app/delete-app.component';

@NgModule({
  declarations: [
    ListAppsComponent,
    CreateAppComponent,
    DeleteAppComponent
  ],
  imports: [
    ModalModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule
  ],
  bootstrap: [
    CreateAppComponent,
    DeleteAppComponent
  ]
})
export class ListAppsModule { }
