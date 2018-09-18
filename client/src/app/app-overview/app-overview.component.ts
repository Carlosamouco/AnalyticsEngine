import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { CreateVersionComponent } from './create-version/create-version.component';
import { DeleteVersionComponent } from './delete-version/delete-version.component';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-app-overview',
  templateUrl: './app-overview.component.html',
  styleUrls: ['./app-overview.component.css']
})
export class AppOverviewComponent implements OnInit {

  public app: any;
  public createModalRef: BsModalRef;
  public deleteModalRef: BsModalRef;

  constructor(private route: ActivatedRoute, private modalService: BsModalService,
    private http: HttpClient, private router: Router, public auth: AuthService) {

    const data = route.snapshot.data['app'];

    if (!data) {
      this.router.navigate(['/404'], { skipLocationChange: true });
    }

    data.algorithms.reverse();
    this.app = data;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.http.get<any>(`/api/application/${params['appId']}`)
        .subscribe((data) => {
          data.algorithms.reverse();
          this.app = data;
        });
    });
  }

  public openCreateVersionModal(algorithm?) {
    const state = {
      app_id: this.app._id
    };

    if (algorithm) {
      state['version'] = algorithm.version;
      state['description'] = algorithm.description;
      state['version_id'] = algorithm._id;
    }

    this.createModalRef = this.modalService.show(CreateVersionComponent, {
      class: 'modal-lg',
      initialState: state
    });

    this.createModalRef.content.action.subscribe(value => {
      if (algorithm) {
        const i = this.app.algorithms.indexOf(algorithm);
        this.app.algorithms[i] = value;
      } else {
        this.app.algorithms.unshift(value);
      }
    });
  }

  public openDeleteVersionModal(algorithm) {

    this.deleteModalRef = this.modalService.show(DeleteVersionComponent, {
      class: 'modal-lg',
      initialState: {
        app_id: this.app._id,
        version_id: algorithm._id
      }
    });

    this.deleteModalRef.content.action.subscribe(value => {
      const i = this.app.algorithms.indexOf(algorithm);
      this.app.algorithms.splice(i, 1);
    });
  }

}
