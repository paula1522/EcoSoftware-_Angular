import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoticiaService } from '../../Services/noticias.service';
import { Noticia } from '../../Models/noticia';
import { Titulo } from "../../shared/titulo/titulo";

@Component({
  selector: 'cards-noticias',
  standalone: true,
  imports: [CommonModule, Titulo],
  templateUrl: './cards-noticias.component.html',
  styleUrls: ['./cards-noticias.component.css']
})
export class CardsNoticias implements OnInit {

  noticias: Noticia[] = [];
  cargando = true;

  constructor(private noticiaService: NoticiaService) {}

  ngOnInit(): void {
    this.noticiaService.listarNoticias().subscribe({
      next: data => {
        this.noticias = data;
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  abrirNoticia(url: string): void {
    window.open(url, '_blank');
  }
}
