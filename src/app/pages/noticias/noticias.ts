import { Component } from '@angular/core';
import { CardsNoticias } from "../../Logic/cards-noticias.component/cards-noticias.component";
import { Header } from "../../core/header/header";

@Component({
  selector: 'app-noticias',
  imports: [CardsNoticias, Header],
  templateUrl: './noticias.html',
  styleUrl: './noticias.css',
})
export class Noticias {

}
