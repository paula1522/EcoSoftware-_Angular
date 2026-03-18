import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsRecoleccionCiudadano } from './cards-recoleccion-ciudadano';

describe('CardsRecoleccionCiudadano', () => {
  let component: CardsRecoleccionCiudadano;
  let fixture: ComponentFixture<CardsRecoleccionCiudadano>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsRecoleccionCiudadano]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsRecoleccionCiudadano);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
