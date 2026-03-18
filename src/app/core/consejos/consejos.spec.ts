import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Consejos } from './consejos';

describe('Consejos', () => {
  let component: Consejos;
  let fixture: ComponentFixture<Consejos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Consejos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Consejos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
