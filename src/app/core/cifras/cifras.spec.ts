import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cifras } from './cifras';

describe('Cifras', () => {
  let component: Cifras;
  let fixture: ComponentFixture<Cifras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cifras]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cifras);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
