import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRegistro } from './form-registro';

describe('FormRegistro', () => {
  let component: FormRegistro;
  let fixture: ComponentFixture<FormRegistro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormRegistro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormRegistro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
