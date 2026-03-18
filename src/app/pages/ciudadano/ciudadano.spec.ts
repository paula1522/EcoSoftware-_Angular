import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ciudadano } from './ciudadano';

describe('Ciudadano', () => {
  let component: Ciudadano;
  let fixture: ComponentFixture<Ciudadano>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ciudadano]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ciudadano);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
