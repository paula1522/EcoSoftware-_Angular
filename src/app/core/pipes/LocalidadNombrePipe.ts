import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localidadNombre',
  standalone: true
})
export class LocalidadNombrePipe implements PipeTransform {

  transform(localidadBD: string): string {
    switch (localidadBD) {
      case 'Usaquen': return 'Usaquén';
      case 'Chapinero': return 'Chapinero';
      case 'Santa_Fe': return 'Santa Fe';
      case 'San_Cristobal': return 'San Cristóbal';
      case 'Usme': return 'Usme';
      case 'Tunjuelito': return 'Tunjuelito';
      case 'Bosa': return 'Bosa';
      case 'Kennedy': return 'Kennedy';
      case 'Fontibon': return 'Fontibón';
      case 'Engativa': return 'Engativá';
      case 'Suba': return 'Suba';
      case 'Barrios_Unidos': return 'Barrios Unidos';
      case 'Teusaquillo': return 'Teusaquillo';
      case 'Los_Martires': return 'Los Mártires';
      case 'Antonio_Nariño': return 'Antonio Nariño';
      case 'Puente_Aranda': return 'Puente Aranda';
      case 'Candelaria': return 'Candelaria';
      case 'Rafael_Uribe_Uribe': return 'Rafael Uribe Uribe';
      case 'Ciudad_Bolivar': return 'Ciudad Bolívar';
      case 'Sumapaz': return 'Sumapaz';

      default:
        return localidadBD
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
    }
  }
}
