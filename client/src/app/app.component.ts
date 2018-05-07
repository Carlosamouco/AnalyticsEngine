import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';

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

  constructor(private router: Router, private http: HttpClient) {
    this.selectedItem = false;
    this.dataSource = Observable.create((observer: any) => {
      // Runs on every search
      observer.next(this.selected);
    }).mergeMap((token: string) => this.getApps(token));
  }

  public onSelect(event: TypeaheadMatch): void {
    this.selected = `${event.item.name} - ${event.item.author}`;
    this.selectedItem = event.item;
  }

  private getApps(token: string): Observable<any> {
    return this.http.get('/api/applications', { params: { q: token.replace(' - ', ' ') } });
  }

  public onSubmit() {
    if (this.selectedItem) {
      this.router.navigate([`/app/${this.selectedItem.id}`]);
      this.selectedItem = undefined;
      this.selected = '';
    } else if (this.selected !== '') {
      this.router.navigate(['/apps']);
    }
  }
}
