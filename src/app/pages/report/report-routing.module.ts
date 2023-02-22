import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportHomeComponent } from './report-home.component';
import { ReportDetailComponent } from './report-detail.component';
import { ReportAddComponent } from './report-add.component';


const routes: Routes = [
  {
    path: '',
    component: ReportHomeComponent
  },
  {
    path: 'detail',
    component: ReportDetailComponent
  },
  {
    path: 'add',
    component: ReportAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportRoutingModule {}
