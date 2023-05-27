import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoryReportComponent } from './category-report.component';
import { CategoryReportAddComponent } from './category-report-add.component';
import { CategoryReportDetailComponent } from './category-report-detail.component';


const routes: Routes = [
  {
    path: '',
    component: CategoryReportComponent
  },
  {
    path: 'add',
    component: CategoryReportAddComponent
  },
  {
    path: 'detail',
    component: CategoryReportDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CategoryReportRoutingModule {}
