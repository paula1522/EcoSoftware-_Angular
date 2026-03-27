import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecolectorRutas } from './recolector-rutas';

describe('RecolectorRutas', () => {
  let component: RecolectorRutas;
  let fixture: ComponentFixture<RecolectorRutas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecolectorRutas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecolectorRutas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
