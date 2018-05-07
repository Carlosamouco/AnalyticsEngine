import { Component, OnInit, EventEmitter, Output  } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { ApplicationDetails } from '../app-details.types';

@Component({
  selector: 'app-upload-modal',
  templateUrl: './upload-modal.component.html',
  styleUrls: ['./upload-modal.component.css']
})
export class UploadModalComponent implements OnInit {
  @Output() public action = new EventEmitter();

  public override: boolean;
  public files: string;
  public app_id: string;
  public version_id: string;

  constructor(public bsModalRef: BsModalRef, private http: HttpClient) {
    this.files = '';
    this.override = true;
  }

  ngOnInit() {
  }

  public onFilesChange(input) {
    if (input.files.length > 1) {
      this.files = `${input.files.length} files selected.`;
    } else if (input.files.length === 1) {
      this.files = input.files[0].name;
    } else {
      this.files = '';
    }
  }

  public onSubmit(fInput) {
    const formData: FormData = new FormData();

    formData.append('override', this.override + '');
    formData.append('app_id', this.app_id);
    formData.append('version_id', this.version_id);
    for (const file of (<File[]>fInput.files)) {
      formData.append('files', file, file.name);
    }

    return this.http.post('/api/upload', formData)
      .subscribe((data) => {
        const app = (<any>data).app;
        this.action.emit(app.algorithms[0].files);
        this.bsModalRef.hide();
      });

  }

}
