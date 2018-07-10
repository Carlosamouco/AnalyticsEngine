import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvokeAppComponent } from './invoke-app.component';

describe('InvokeAppComponent', () => {
  let component: InvokeAppComponent;
  let fixture: ComponentFixture<InvokeAppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvokeAppComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvokeAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
