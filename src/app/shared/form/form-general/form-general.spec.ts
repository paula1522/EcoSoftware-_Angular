import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormGeneral } from './form-general';

describe('FormGeneral', () => {
  let component: FormGeneral;
  let fixture: ComponentFixture<FormGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
