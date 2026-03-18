import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarTabla } from './listar-tabla';

describe('ListarTabla', () => {
  let component: ListarTabla;
  let fixture: ComponentFixture<ListarTabla>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarTabla]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarTabla);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
