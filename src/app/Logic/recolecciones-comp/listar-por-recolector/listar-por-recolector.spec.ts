import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarPorRecolector } from './listar-por-recolector';

describe('ListarPorRecolector', () => {
  let component: ListarPorRecolector;
  let fixture: ComponentFixture<ListarPorRecolector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarPorRecolector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarPorRecolector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
