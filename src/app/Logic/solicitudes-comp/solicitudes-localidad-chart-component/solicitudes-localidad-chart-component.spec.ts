import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudesLocalidadChartComponent } from './solicitudes-localidad-chart-component';

describe('SolicitudesLocalidadChartComponent', () => {
  let component: SolicitudesLocalidadChartComponent;
  let fixture: ComponentFixture<SolicitudesLocalidadChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudesLocalidadChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudesLocalidadChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
