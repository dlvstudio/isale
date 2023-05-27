import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TimelyReportDetailComponent } from './report-detail.component';
import { TimelyReportAddComponent } from './report-add.component';


const routes: Routes = [
  {
    path: 'detail',
    component: TimelyReportDetailComponent
  },
  {
    path: 'add',
    component: TimelyReportAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TimelyReportRoutingModule {}
