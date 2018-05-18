import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Endpoint, EndpointParam } from '../list-endpoints/list-endpoints.types';

@Component({
  selector: 'app-endpoint-details',
  templateUrl: './endpoint-details.component.html',
  styleUrls: ['./endpoint-details.component.css']
})
export class EndpointDetailsComponent implements OnInit {
  public endpoint: Endpoint;

  public tempParam: EndpointParam;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {
    this.endpoint = route.snapshot.data['endpoint'];

    if (!this.endpoint) {
      this.router.navigate(['/404'], { skipLocationChange: true });
    }
  }

  ngOnInit() {
  }

  public saveEndpoint(fInput) {

    this.http.post<Endpoint>('/api/update/endpoint', {
      description: this.endpoint.description,
      url: this.endpoint.url,
      id: this.endpoint._id,
      method: this.endpoint.method
    })
      .subscribe((data) => {
        this.endpoint = data;
      });
  }

  public addParameter() {
    for (let i = 0; i < this.endpoint.parameters.length; i++) {
      const p = this.endpoint.parameters[i];
      if ((<any>p).edit) {
        this.cancelEditParameter(i);
      }
    }

    this.endpoint.parameters.unshift(<any>{
      name: '',
      description: '',
      edit: true
    });
  }

  public onUrlChange() {
    if (this.endpoint.url !== '') {
      if (!(this.endpoint.url.startsWith('http://') || this.endpoint.url.startsWith('https://'))) {
        this.endpoint.url = 'http://' + this.endpoint.url;
      }
    }
  }

  public saveParameter() {
    this.http.post<Endpoint>('/api/create/endpointparams', {
      id: this.endpoint._id,
      parameters: this.endpoint.parameters
    })
      .subscribe((data) => {
        this.endpoint = data;
      });
  }

  public editParameter(param) {
    for (let i = 0; i < this.endpoint.parameters.length; i++) {
      const p = this.endpoint.parameters[i];
      if ((<any>p).edit) {
        this.cancelEditParameter(i);
      }
    }

    this.tempParam = {
      name: param.name,
      description: param.description
    };

    param.edit = true;
  }

  public cancelEditParameter(i) {
    if (this.tempParam) {
      this.endpoint.parameters[i] = this.tempParam;
      this.tempParam = null;
    } else {
      this.endpoint.parameters.splice(i, 1);
    }

  }

  public deleteParameter(i) {
    this.tempParam = null;
    const params = this.endpoint.parameters.slice();
    params.splice(i, 1);

    this.http.post<Endpoint>('/api/create/endpointparams', {
      id: this.endpoint._id,
      parameters: params
    })
      .subscribe((data) => {
        this.endpoint = data;
      });
  }

}
