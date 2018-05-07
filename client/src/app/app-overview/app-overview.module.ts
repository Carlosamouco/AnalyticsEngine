import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';

import { AppOverviewComponent } from './app-overview.component';
import { CreateVersionComponent } from './create-version/create-version.component';
import { DeleteVersionComponent } from './delete-version/delete-version.component';

@NgModule({
  declarations: [
    AppOverviewComponent,
    CreateVersionComponent,
    DeleteVersionComponent
  ],
  imports: [
    ModalModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule
  ],
  bootstrap: [
    CreateVersionComponent,
    DeleteVersionComponent
  ]
})
export class AppOverviewModule { }
