import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardInscripcion } from './card-inscripcion';

describe('CardInscripcion', () => {
  let component: CardInscripcion;
  let fixture: ComponentFixture<CardInscripcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardInscripcion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardInscripcion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
