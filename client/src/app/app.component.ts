import { Component, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { AuthService } from './auth.service';
import { UserMessagesService } from './user-messages.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public isCollapsed = true;
  public dataSource: Observable<any>;
  public selected: string;
  public selectedItem: any;

  public currLink: number;

  constructor(private router: Router, private http: HttpClient,
    private renderer: Renderer2, public auth: AuthService, private userMsg: UserMessagesService) {
    this.selectedItem = false;
    this.dataSource = Observable.create((observer: any) => {
      observer.next(this.selected);
    })
    .pipe(
      mergeMap((token: string) => this.getApps(token))
    );

    this.router.events.subscribe((val) => {
      if ((val instanceof NavigationEnd) && !this.isCollapsed) {
        this.collapseNav(true);
      }

      if (val instanceof NavigationEnd) {
        switch (val.url.split('/')[1]) {
          case 'apps': case 'app':
            this.currLink = 0;
            break;
          case 'endpoints': case 'endpoint':
            this.currLink = 1;
            break;
          case 'login':
            this.currLink = 2;
            break;
          default:
            this.currLink = 0;
        }
      }
    });

  }

  public logout() {
    this.auth.destroySession();
    this.router.navigate(['/'])
      .then(() => {
        this.userMsg.addMesssage('Successfully logged out!');
      });
  }

  public onSelect(event: TypeaheadMatch): void {
    this.selected = `${event.item.name} - ${event.item.author}`;
    this.selectedItem = event.item;
  }

  private getApps(token: string): Observable<any> {
    return this.http.get('/api/applications', { params: { q: token.replace(' - ', ' ') } });
  }

  public collapseNav(val: boolean) {
    this.isCollapsed = val;
    if (!this.isCollapsed) {
      this.renderer.addClass(document.body, 'modal-open');
    } else {
      this.renderer.removeClass(document.body, 'modal-open');
    }
  }

  public onSubmit() {
    if (this.selectedItem) {
      this.router.navigate([`/app/${this.selectedItem._id}`]);
      this.selectedItem = undefined;
      this.selected = '';
    } else if (this.selected !== '') {
      this.router.navigate(['/apps']);
    }
  }
}
