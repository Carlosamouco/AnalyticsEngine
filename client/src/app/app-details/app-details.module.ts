import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TabsModule } from 'ngx-bootstrap';
import { ModalModule } from 'ngx-bootstrap/modal';
import { CollapseModule } from 'ngx-bootstrap';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

import { AppDetailsComponent } from './app-details.component';
import { UploadModalComponent } from './upload-modal/upload-modal.component';

@NgModule({
  declarations: [
    AppDetailsComponent,
    UploadModalComponent
  ],
  imports: [
    ModalModule,
    CollapseModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    TooltipModule,
    TypeaheadModule,
    RouterModule
  ],
  bootstrap: [UploadModalComponent]
})
export class AppDetailsModule { }
