import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubirDocumentos } from './subir-documentos';

describe('SubirDocumentos', () => {
  let component: SubirDocumentos;
  let fixture: ComponentFixture<SubirDocumentos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubirDocumentos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubirDocumentos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
