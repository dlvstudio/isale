import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DebtReportComponent } from './debt-report.component';
import { DebtReportAddComponent } from './debt-report-add.component';
import { DebtReportDetailComponent } from './debt-report-detail.component';


const routes: Routes = [
  {
    path: '',
    component: DebtReportComponent
  },
  {
    path: 'add',
    component: DebtReportAddComponent
  },
  {
    path: 'detail',
    component: DebtReportDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DebtReportRoutingModule {}
