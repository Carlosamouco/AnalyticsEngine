import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PopoverModule } from 'ngx-bootstrap/popover';

import { AddFilesModalComponent } from './add-files-modal/add-files-modal.component';
import { InvokeAppComponent } from './invoke-app.component';

@NgModule({
  declarations: [
    InvokeAppComponent,
    AddFilesModalComponent,
  ],
  imports: [
    ModalModule,
    BsDropdownModule,
    PopoverModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule
  ],
  bootstrap: [
    AddFilesModalComponent,
  ]
})
export class InvokeAppModule { }
