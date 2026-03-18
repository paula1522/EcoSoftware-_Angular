import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsNoticiasComponent } from './cards-noticias.component';

describe('CardsNoticiasComponent', () => {
  let component: CardsNoticiasComponent;
  let fixture: ComponentFixture<CardsNoticiasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsNoticiasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsNoticiasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
