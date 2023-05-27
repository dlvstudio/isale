import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PointAddComponent } from './point-add.component';
import { PointComponent } from './point.component';


const routes: Routes = [
  {
    path: '',
    component: PointComponent
  },
  {
    path: 'add',
    component: PointAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PointRoutingModule {}
