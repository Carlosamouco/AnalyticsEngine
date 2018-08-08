import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { AppList } from './list-apps.types';
import { CreateAppComponent } from './create-app/create-app.component';
import { DeleteAppComponent } from './delete-app/delete-app.component';

import { AuthService } from './../auth.service';

@Component({
  selector: 'app-list-apps',
  templateUrl: './list-apps.component.html',
  styleUrls: ['./list-apps.component.css']
})
export class ListAppsComponent implements OnInit {

  public createAppModalRef: BsModalRef;
  public deleteAppModelRef: BsModalRef;
  public apps: AppList[];

  constructor(private route: ActivatedRoute, private modalService: BsModalService, public auth: AuthService) {
    this.apps = route.snapshot.data['apps'];
    this.apps.reverse();
  }

  ngOnInit() {
  }

  public openDeleteAppModal(app) {
    this.deleteAppModelRef = this.modalService.show(DeleteAppComponent, {
      class: 'modal-lg',
      initialState: {
        app_id: app._id
      }
    });

    this.deleteAppModelRef.content.action.subscribe(value => {
      const i = this.apps.indexOf(app);
      this.apps.splice(i, 1);
    });
  }

  public openCreateAppModal(app?) {
    this.createAppModalRef = this.modalService.show(CreateAppComponent, {
      class: 'modal-lg',
      initialState: {
        app: app
      }
    });

    this.createAppModalRef.content.action.subscribe(value => {
      if (app) {
        const i = this.apps.indexOf(app);
        this.apps[i] = value;
      } else {
        this.apps.push(value);
      }
    });
  }

}
