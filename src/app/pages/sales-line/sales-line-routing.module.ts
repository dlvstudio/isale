import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalesLineAddComponent } from './sales-line-add.component';
import { SalesLineComponent } from './sales-line.component';

const routes: Routes = [
  {
    path: '',
    component: SalesLineComponent
  },
  {
    path: 'add',
    component: SalesLineAddComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesLineRoutingModule {}
