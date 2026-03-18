import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'empresa',
    loadComponent: () => import('./pages/empresa/empresa').then(m => m.Empresa)
  },
  // ...otras rutas...
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}