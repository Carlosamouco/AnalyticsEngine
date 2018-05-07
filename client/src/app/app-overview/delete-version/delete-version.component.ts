import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-delete-version',
  templateUrl: './delete-version.component.html',
  styleUrls: ['./delete-version.component.css']
})
export class DeleteVersionComponent implements OnInit {
  @Output() public action = new EventEmitter();

  public app_id: string;
  public version_id: string;

  constructor(public bsModalRef: BsModalRef, private http: HttpClient) { }

  ngOnInit() {
  }

  public deleteVersion() {
    return this.http.post('api/delete/algorithm', {
      app_id: this.app_id,
      version_id: this.version_id
    })
      .subscribe((data) => {
        this.action.emit(data);
        this.bsModalRef.hide();
      });
  }

}
