import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CalendarAddComponent } from './calendar-add.component';
import { CalendarDetailComponent } from './calendar-detail.component';
import { CalendarComponent } from './calendar.component';


const routes: Routes = [
  {
    path: '',
    component: CalendarComponent
  },
  {
    path: 'add',
    component: CalendarAddComponent
  },
  {
    path: 'detail',
    component: CalendarDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CalendarRoutingModule {}
