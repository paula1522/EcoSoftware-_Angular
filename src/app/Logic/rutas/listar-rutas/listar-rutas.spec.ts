import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarRutas } from './listar-rutas';

describe('ListarRutas', () => {
  let component: ListarRutas;
  let fixture: ComponentFixture<ListarRutas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarRutas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarRutas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
