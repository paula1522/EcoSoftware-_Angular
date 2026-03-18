import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCrudCapacitacion } from './card-crud-capacitacion';

describe('CardCrudCapacitacion', () => {
  let component: CardCrudCapacitacion;
  let fixture: ComponentFixture<CardCrudCapacitacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardCrudCapacitacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardCrudCapacitacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
