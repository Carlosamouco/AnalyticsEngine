import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFilesModalComponent } from './add-files-modal.component';

describe('AddFilesModalComponent', () => {
  let component: AddFilesModalComponent;
  let fixture: ComponentFixture<AddFilesModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFilesModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFilesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
