import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-delete-endpoint',
  templateUrl: './delete-endpoint.component.html',
  styleUrls: ['./delete-endpoint.component.css']
})
export class DeleteEndpointComponent implements OnInit {
  @Output() public action = new EventEmitter();

  public endpoint_id: string;

  constructor(public bsModalRef: BsModalRef, private http: HttpClient) { }

  ngOnInit() {
  }

  public deleteEndpoint() {
    return this.http.post('api/delete/endpoint', {
      id: this.endpoint_id
    })
      .subscribe((data) => {
        this.action.emit(data);
        this.bsModalRef.hide();
      });
  }

}
