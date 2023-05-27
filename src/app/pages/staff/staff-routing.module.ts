import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StaffComponent } from './staff.component';
import { StaffDetailComponent } from './staff-detail.component';
import { StaffAddComponent } from './staff-add.component';


const routes: Routes = [
  {
    path: '',
    component: StaffComponent
  },
  {
    path: 'detail',
    component: StaffDetailComponent
  },
  {
    path: 'add',
    component: StaffAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StaffRoutingModule {}
