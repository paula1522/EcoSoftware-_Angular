import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechazadasMotivoChartComponent } from './rechazadas-motivo-chart-component';

describe('RechazadasMotivoChartComponent', () => {
  let component: RechazadasMotivoChartComponent;
  let fixture: ComponentFixture<RechazadasMotivoChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechazadasMotivoChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RechazadasMotivoChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
