import { TestBed, inject } from '@angular/core/testing';

import { UserMessagesService } from './user-messages.service';

describe('UserMessagesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserMessagesService]
    });
  });

  it('should be created', inject([UserMessagesService], (service: UserMessagesService) => {
    expect(service).toBeTruthy();
  }));
});
