import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChartDetailComponent } from './chart-detail.component';


const routes: Routes = [
  {
    path: 'detail',
    component: ChartDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChartRoutingModule {}
