import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaSolicitudes } from './vista-solicitudes';

describe('VistaSolicitudes', () => {
  let component: VistaSolicitudes;
  let fixture: ComponentFixture<VistaSolicitudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaSolicitudes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VistaSolicitudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
