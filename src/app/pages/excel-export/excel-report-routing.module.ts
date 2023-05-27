import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExcelReportHomeComponent } from './excel-report-home.component';


const routes: Routes = [
  {
    path: '',
    component: ExcelReportHomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExcelReportRoutingModule {}
