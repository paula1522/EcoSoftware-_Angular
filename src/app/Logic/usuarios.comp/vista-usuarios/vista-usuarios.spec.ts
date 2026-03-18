import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaUsuarios } from './vista-usuarios';

describe('VistaUsuarios', () => {
  let component: VistaUsuarios;
  let fixture: ComponentFixture<VistaUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaUsuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VistaUsuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
