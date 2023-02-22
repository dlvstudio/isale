import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StaffComponent } from './staff.component';
import { StaffDetailComponent } from './staff-detail.component';
import { StaffAddComponent } from './staff-add.component';
import { StaffSearchComponent } from './search.component';
import { ShiftAddComponent } from './shift-add.component';
import { ShiftSearchComponent } from './shift-search.component';


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
  {
    path: 'search',
    component: StaffSearchComponent
  },
  {
    path: 'shift-add',
    component: ShiftAddComponent
  },
  {
    path: 'shift-search',
    component: ShiftSearchComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StaffRoutingModule {}
