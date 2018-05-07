import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-delete-app',
  templateUrl: './delete-app.component.html',
  styleUrls: ['./delete-app.component.css']
})
export class DeleteAppComponent implements OnInit {
  @Output() public action = new EventEmitter();

  public app_id: string;

  constructor(public bsModalRef: BsModalRef, private http: HttpClient) { }

  ngOnInit() {
  }

  public deleteApp() {
    return this.http.post('api/delete/app', {
      app_id: this.app_id
    })
      .subscribe((data) => {
        this.action.emit(data);
        this.bsModalRef.hide();
      });
  }

}
