import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-create-version',
  templateUrl: './create-version.component.html',
  styleUrls: ['./create-version.component.css']
})
export class CreateVersionComponent implements OnInit {
  @Output() public action = new EventEmitter();

  public app_id: string;
  public version: string;
  public description: string;
  public version_id: boolean;

  public onError: boolean;

  constructor(public bsModalRef: BsModalRef, private http: HttpClient) {
    this.onError = false;
    this.version = '';
    this.description = '';
  }

  ngOnInit() {
  }

  public onSubmit() {
    let url = '/api/create/algorithm';
    const req = {
      app_id: this.app_id,
      version: this.version,
      description: this.description
    };

    if (this.version_id) {
      url = '/api/update/algorithm';
      req['version_id'] = this.version_id;
    }

    return this.http.post(url, req)
      .subscribe((data: any) => {
        this.action.emit(data.algorithms[0]);
        this.bsModalRef.hide();
      },
        (error) => {
          this.onError = true;
          this.version = '';
        });
  }

}
