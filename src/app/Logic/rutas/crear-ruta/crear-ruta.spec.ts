import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearRuta } from './crear-ruta';

describe('CrearRuta', () => {
  let component: CrearRuta;
  let fixture: ComponentFixture<CrearRuta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearRuta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearRuta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
