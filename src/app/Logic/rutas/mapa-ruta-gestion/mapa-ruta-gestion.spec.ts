import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaRutaGestion } from './mapa-ruta-gestion';

describe('MapaRutaGestion', () => {
  let component: MapaRutaGestion;
  let fixture: ComponentFixture<MapaRutaGestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaRutaGestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapaRutaGestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
