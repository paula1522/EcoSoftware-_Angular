import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WasteCarrusel } from './waste-carrusel';

describe('WasteCarrusel', () => {
  let component: WasteCarrusel;
  let fixture: ComponentFixture<WasteCarrusel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WasteCarrusel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WasteCarrusel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
