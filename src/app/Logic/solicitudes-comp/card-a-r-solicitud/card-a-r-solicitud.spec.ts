import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardARSolicitud } from './card-a-r-solicitud';

describe('CardARSolicitud', () => {
  let component: CardARSolicitud;
  let fixture: ComponentFixture<CardARSolicitud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardARSolicitud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardARSolicitud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
