import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-teste',
  templateUrl: './teste.component.html',
  styleUrls: ['./teste.component.css']
})
export class TesteComponent implements OnInit {

  public appId: any;
  public algorithmId: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    const data = route.snapshot.data['apps'];
    this.appId = data[0]._id;
    this.algorithmId = data[0].algorithms[0]._id;

    this.testeAPI();
  }

  private testeAPI() {
    const promises = [];

    const formData: FormData = new FormData();

    formData.append('options', JSON.stringify({
      output: {
        stderr: true,
        stdout: true,
        files: true,
        mode: '1'
      },
      secure: false,
      timeout: 60000
    }));
    formData.append('args', '{}');
    formData.append('app_id', this.appId);
    formData.append('version_id', this.algorithmId);

    for (let i = 0; i < 1; i++) {
      promises.push(new Promise(
        (resolve, reject) => {
          this.http.post('/api/invoke/form', formData)
            .subscribe((data) => {
              console.log(data);
            });
        }));
    }
  }

  ngOnInit() {
  }

}
