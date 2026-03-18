import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsSolicitud } from './cards-solicitud';

describe('CardsSolicitud', () => {
  let component: CardsSolicitud;
  let fixture: ComponentFixture<CardsSolicitud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsSolicitud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsSolicitud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
