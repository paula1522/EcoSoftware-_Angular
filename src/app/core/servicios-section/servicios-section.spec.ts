import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosSection } from './servicios-section';

describe('ServiciosSection', () => {
  let component: ServiciosSection;
  let fixture: ComponentFixture<ServiciosSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
