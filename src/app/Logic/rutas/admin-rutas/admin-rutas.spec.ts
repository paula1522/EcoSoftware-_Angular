import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRutas } from './admin-rutas';

describe('AdminRutas', () => {
  let component: AdminRutas;
  let fixture: ComponentFixture<AdminRutas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRutas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRutas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
