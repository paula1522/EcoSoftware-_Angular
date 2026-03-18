import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendientesAceptadasChartComponent } from './pendientes-aceptadas-chart-component';

describe('PendientesAceptadasChartComponent', () => {
  let component: PendientesAceptadasChartComponent;
  let fixture: ComponentFixture<PendientesAceptadasChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendientesAceptadasChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendientesAceptadasChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
