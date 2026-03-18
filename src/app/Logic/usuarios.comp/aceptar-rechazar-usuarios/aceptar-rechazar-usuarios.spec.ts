import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AceptarRechazarUsuarios } from './aceptar-rechazar-usuarios';

describe('AceptarRechazarUsuarios', () => {
  let component: AceptarRechazarUsuarios;
  let fixture: ComponentFixture<AceptarRechazarUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AceptarRechazarUsuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AceptarRechazarUsuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
