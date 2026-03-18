import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Solcitudes } from './solcitudes';

describe('Solcitudes', () => {
  let component: Solcitudes;
  let fixture: ComponentFixture<Solcitudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Solcitudes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Solcitudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
