import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormComp } from './form.comp';

describe('formcomp', () => {
  let component: FormComp;
  let fixture: ComponentFixture<FormComp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormComp]
    }).compileComponents();

    fixture = TestBed.createComponent(FormComp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show registro form when mode=registro', () => {
    component.mode = 'registro';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form h2')?.textContent).toContain('Registro');
  });

  it('should show login form when mode=login', () => {
    component.mode = 'login';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form h2')?.textContent).toContain('Iniciar Sesión');
  });

  it('should show filtro form when mode=filtro', () => {
    component.mode = 'filtro';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form h2')?.textContent).toContain('Filtrar');
  });
});
