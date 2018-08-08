import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserMessagesService {

  public userMessages: string[];

  constructor() {
    this.userMessages = [];
  }

  public addMesssage(msg: string) {
    this.userMessages.unshift(msg);
    setTimeout(() => {
      const i = this.userMessages.lastIndexOf(msg);
      if (i >= 0) {
        this.userMessages.splice(i, 1);
      }
    }, 2500);

    return;
  }

  public removeMessage(index: number) {
    this.userMessages.splice(index, 1);
  }

  public getMessages() {
    return this.userMessages;
  }

}
