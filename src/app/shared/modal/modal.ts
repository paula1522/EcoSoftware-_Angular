import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrls: ['./modal.css'],
})
export class Modal {
  @Input() isOpen: boolean = false;
  @Input() title?: string | undefined;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() headerColor: string = '#16a34a';//color por defecto
  @Input() showCloseButton: boolean = true;

  @Output() closed = new EventEmitter<void>();

  
  close() {
    this.isOpen = false;
    this.closed.emit();
  }

  closeOnBackdrop(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.close();
    }
  }
}
