import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rutas } from './rutas';

describe('Rutas', () => {
  let component: Rutas;
  let fixture: ComponentFixture<Rutas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rutas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rutas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
