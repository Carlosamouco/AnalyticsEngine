import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { DeleteEndpointComponent } from './delete-endpoint/delete-endpoint.component';
import { CreateEndpointComponent } from './create-endpoint/create-endpoint.component';
import { Endpoint } from './list-endpoints.types';

@Component({
  selector: 'app-list-endpoints',
  templateUrl: './list-endpoints.component.html',
  styleUrls: ['./list-endpoints.component.css']
})
export class ListEndpointsComponent implements OnInit {

  public endpoints: Endpoint[];

  public deleteEndpointModelRef: BsModalRef;
  public createEndpointModelRef: BsModalRef;

  constructor(private route: ActivatedRoute, private modalService: BsModalService) {
    this.endpoints = route.snapshot.data['endpoints'];
  }

  ngOnInit() {
  }

  public openDeleteEndpointModal(endpoint) {
    this.deleteEndpointModelRef = this.modalService.show(DeleteEndpointComponent, {
      class: 'modal-lg',
      initialState: {
        endpoint_id: endpoint._id
      }
    });

    this.deleteEndpointModelRef.content.action.subscribe(value => {
      const i = this.endpoints.indexOf(endpoint);
      this.endpoints.splice(i, 1);
    });
  }

  public openCreateEndpointModal(endpoint?) {
    this.createEndpointModelRef = this.modalService.show(CreateEndpointComponent, {
      class: 'modal-lg',
      initialState: {
        endpoint: endpoint
      }
    });

    this.createEndpointModelRef.content.action.subscribe(value => {
      if (endpoint) {
        const i = this.endpoints.indexOf(endpoint);
        this.endpoints[i] = value;
      } else {
        this.endpoints.push(value);
      }
    });
  }

}
