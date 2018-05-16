import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteEndpointComponent } from './delete-endpoint.component';

describe('DeleteEndpointComponent', () => {
  let component: DeleteEndpointComponent;
  let fixture: ComponentFixture<DeleteEndpointComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteEndpointComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
