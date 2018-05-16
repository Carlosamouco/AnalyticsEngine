import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListEndpointsComponent } from './list-endpoints.component';

describe('ListEndpointsComponent', () => {
  let component: ListEndpointsComponent;
  let fixture: ComponentFixture<ListEndpointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListEndpointsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
