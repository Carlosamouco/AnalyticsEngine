import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';

import { ListEndpointsComponent } from './list-endpoints.component';
import { CreateEndpointComponent } from './create-endpoint/create-endpoint.component';
import { DeleteEndpointComponent } from './delete-endpoint/delete-endpoint.component';

@NgModule({
  declarations: [
    ListEndpointsComponent,
    CreateEndpointComponent,
    DeleteEndpointComponent
  ],
  imports: [
    ModalModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule
  ],
  bootstrap: [
    CreateEndpointComponent,
    DeleteEndpointComponent
  ]
})
export class ListEndpointsModule { }
