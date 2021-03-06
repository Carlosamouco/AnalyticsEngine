import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { Endpoint } from '../list-endpoints.types';

@Component({
  selector: 'app-create-endpoint',
  templateUrl: './create-endpoint.component.html',
  styleUrls: ['./create-endpoint.component.css']
})
export class CreateEndpointComponent implements OnInit {
  @Output() public action = new EventEmitter();

  public endpoint: Endpoint;
  public url: string;
  public description: string;
  public method: string;

  public onError: boolean;

  constructor(public bsModalRef: BsModalRef, private http: HttpClient) {
    this.onError = false;
  }

  ngOnInit() {
    if (this.endpoint) {
      this.url = this.endpoint.url || '';
      this.description = this.endpoint.description || '';
      this.method = this.endpoint.method || '0';
    } else {
      this.url = '';
      this.description = '';
      this.method = '0';
    }
  }

  public onSubmit(fInput) {
    let url = '/api/create/endpoint';
    const req = {
      description: this.description,
      method: this.method,
      url: this.url
    };

    if (this.endpoint) {
      url = 'api/update/endpoint';
      req['id'] = this.endpoint._id;
    }

    return this.http.post(url, req)
      .subscribe((data) => {
        this.action.emit(data);
        this.bsModalRef.hide();
      },
        (error) => {
          this.url = '';
          this.onError = true;
        });
  }

  public onUrlChange() {
    if (this.url !== '') {
      if (!(this.url.startsWith('http://') || this.url.startsWith('https://'))) {
        this.url = 'http://' + this.url;
      }
    }
  }

}
