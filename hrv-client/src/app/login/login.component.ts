import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router  } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public username: string;
  public pw: string;
  public remember: boolean;

  public loginFail: boolean;

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {
    this.username = localStorage.getItem('User');
    if (this.username) {
      this.remember = true;
    }
  }

  ngOnInit() {
  }

  public onSubmit() {
    if (this.remember) {
      localStorage.setItem('User', this.username);
    } else {
      localStorage.removeItem('User');
    }

    this.http.post('/api/login', {
      username: this.username,
      password: this.pw
    })
      .subscribe((data: any) => {
        this.auth.saveSession(data.token, data.role);
        this.router.navigate(['/']);
      },
        (error) => {
          if (error.status === 403) {
            this.loginFail = true;
            this.pw = '';
            this.username = '';
          }
        });
  }

  public updateErrorStatus() {
    if (this.loginFail) {
      this.loginFail = false;
    }
  }

  public validateForm() {
    return !(this.username && this.username.length > 0 && this.pw && this.pw.length > 0);
  }

}
