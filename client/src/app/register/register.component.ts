import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { UserMessagesService } from '../user-messages.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  public pw: string;
  public pw2: string;

  public role: string;
  public username: string;

  public inUse: boolean;

  constructor(private http: HttpClient, private usrMsg: UserMessagesService) {
    this.role = '';
  }

  ngOnInit() {
  }

  public isPwValide() {
    return (this.pw && this.pw === this.pw2);
  }

  public isUsermameValide() {
    return (this.username && this.username.length >= 3);
  }

  public isRoleValide() {
    return this.role !== '';
  }

  public isValide() {
    return (this.isPwValide() && this.isUsermameValide() && this.isRoleValide());
  }

  public onSubmit() {
    this.http.post('/api/register', {
      username: this.username,
      password: this.pw,
      role: this.role
    })
      .subscribe(() => {
        this.usrMsg.addMesssage(`User named '${this.username}' created!`);
        this.role = '';
        this.username = '';
        this.pw = '';
        this.pw2 = '';
      },
      (error) => {
        if (error.status === 400) {
          this.username = '';
          this.inUse = true;
        }
      }
    );
  }

}
