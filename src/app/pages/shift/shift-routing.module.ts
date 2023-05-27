import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShiftAddComponent } from './shift-add.component';
import { ShiftComponent } from './shift.component';


const routes: Routes = [
  {
    path: '',
    component: ShiftComponent
  },
  {
    path: 'add',
    component: ShiftAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShiftRoutingModule {}
