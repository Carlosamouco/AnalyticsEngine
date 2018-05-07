import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-create-app',
  templateUrl: './create-app.component.html',
  styleUrls: ['./create-app.component.css']
})
export class CreateAppComponent implements OnInit {
  @Output() public action = new EventEmitter();

  public app: any;
  public name: string;
  public author: string;
  public description: string;

  public onError: boolean;

  constructor(public bsModalRef: BsModalRef, private http: HttpClient) {
    this.onError = false;
  }

  ngOnInit() {
    if (this.app) {
      this.name = this.app.name || '';
      this.author = this.app.author || '';
      this.description = this.app.description || '';
    } else {
      this.name = '';
      this.author = '';
      this.description = '';
    }
  }

  public onSubmit(fInput) {
    let url = '/api/create/app';
    const req = {
      description: this.description,
      name: this.name,
      author: this.author
    };

    if (this.app) {
      url = 'api/update/app';
      req['app_id'] = this.app._id;
    }

    return this.http.post(url, req)
      .subscribe((data) => {
        this.action.emit(data);
        this.bsModalRef.hide();
      },
        (error) => {
          this.name = '';
          this.onError = true;
        });
  }

}
