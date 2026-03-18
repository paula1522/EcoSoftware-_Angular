import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Boton } from '../../botones/boton/boton';

export interface FieldConfig {
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'radio' | 'separator';
  name?: string;
  label?: string;
  placeholder?: string;
  options?: { value: string | number; text: string }[];
  cols?: number;
  showIf?: () => boolean;
  showToggle?: boolean;
  icon?: string;      
iconPosition?: 'left' | 'right'; 

}

@Component({
  selector: 'app-form-comp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Boton],
  templateUrl: './form.comp.html',
  styleUrls: ['./form.comp.css'],
})
export class FormComp implements OnInit {
  @Input() fields: FieldConfig[] = [];
  @Input() disableSubmit: boolean = false;
  @Input() formGroup!: FormGroup;

  @Output() submitForm = new EventEmitter<any>();
  @Output() valueChanges = new EventEmitter<any>();

  @Input() showSubmitButton: boolean = true;
  @Input() submitButtonText: string = '';
  @Input() submitButtonClass: string = '';
  @Input() submitButtonIcon: string = 'fa fa-paper-plane';
@Input() submitButtonColor: string = 'custom-success-filled';

  constructor(private cdr: ChangeDetectorRef) {}

  showPasswordMap: Record<string, boolean> = {};

togglePassword(name: string) {
  this.showPasswordMap[name] = !this.showPasswordMap[name];
}


  ngOnInit(): void {
    if (!this.formGroup) {
      console.error('❌ ERROR: Debes pasar un FormGroup desde el componente padre');
      return;
    }

    // Cada vez que cambia un valor, notificamos y forzamos actualización
    this.formGroup.valueChanges.subscribe((value: any) => {
      this.valueChanges.emit(value);
      this.cdr.detectChanges(); //Esto hace que los campos con showIf() se actualicen
    });
  }

  onSubmit(): void {
    if (this.disableSubmit) return;
    if (this.formGroup && this.formGroup.valid) {
      this.submitForm.emit(this.formGroup.value);
    }
  }

  // Método para evaluar showIf de manera más clara en la plantilla
  shouldShow(field: FieldConfig): boolean {
    return !field.showIf || field.showIf();
  }
}
