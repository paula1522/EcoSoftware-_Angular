import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [ CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class Footer {
  currentYear: number = new Date().getFullYear();
}