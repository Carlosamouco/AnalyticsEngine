import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Endpoint } from '../list-endpoints/list-endpoints.types';

@Component({
  selector: 'app-endpoint-details',
  templateUrl: './endpoint-details.component.html',
  styleUrls: ['./endpoint-details.component.css']
})
export class EndpointDetailsComponent implements OnInit {
  public endpoint: Endpoint;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {
    this.endpoint = route.snapshot.data['endpoint'];

    if (!this.endpoint) {
      this.router.navigate(['/404'], { skipLocationChange: true });
    }
  }

  ngOnInit() {
  }

  public saveEndpoint(fInput) {
    const url = '/api/update/endpoint';
    const req = {
      description: this.endpoint.description,
      url: this.endpoint.url,
      id: this.endpoint._id
    };

    return this.http.post<Endpoint>(url, req)
      .subscribe((data) => {
        this.endpoint = data;
      });
  }

}
