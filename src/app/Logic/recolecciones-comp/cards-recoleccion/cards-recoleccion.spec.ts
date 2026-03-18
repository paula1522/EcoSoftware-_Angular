import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsRecoleccion } from './cards-recoleccion';

describe('CardsRecoleccion', () => {
  let component: CardsRecoleccion;
  let fixture: ComponentFixture<CardsRecoleccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsRecoleccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsRecoleccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
