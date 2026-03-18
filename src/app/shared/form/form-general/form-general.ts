import { Component, Output, Input, EventEmitter } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../../imports';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

export interface FieldConfig {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: { label: string; value: any }[];
  value?: any;
  required?: boolean;
  email?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

@Component({
  selector: 'app-form-general',
  standalone: true,
  imports: [COMPARTIR_IMPORTS],
  templateUrl: './form-general.html',
  styleUrl: './form-general.css'
})
export class FormGeneral {
  @Input() fields: FieldConfig[] = [];
  @Output() submitForm = new EventEmitter<any>(); // <-- nombre cambiado
  @Output() onFieldChange = new EventEmitter<{ name: string; value: any }>();
  form!: FormGroup;
  passwordVisible = false;
  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const formGroup: any = {};

    this.fields.forEach(field => {
      const validations = [];

      if (field.required) validations.push(Validators.required);
      if (field.email) validations.push(Validators.email);
      if (field.minLength) validations.push(Validators.minLength(field.minLength));
      if (field.maxLength) validations.push(Validators.maxLength(field.maxLength));
      if (field.min !== undefined) validations.push(Validators.min(field.min));
      if (field.max !== undefined) validations.push(Validators.max(field.max));
      if (field.pattern) validations.push(Validators.pattern(field.pattern));

      formGroup[field.name] = [field.value || '', validations];
    });

    this.form = this.fb.group(formGroup);
  }

  onFormSubmit() {
    console.log('📤 Formulario enviado:', this.form.value);

    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
  togglePassword() {
  this.passwordVisible = !this.passwordVisible;
}
}
