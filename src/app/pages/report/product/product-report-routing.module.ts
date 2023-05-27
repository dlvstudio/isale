import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProductReportComponent } from './product-report.component';
import { ProductReportAddComponent } from './product-report-add.component';
import { ProductReportDetailComponent } from './product-report-detail.component';


const routes: Routes = [
  {
    path: '',
    component: ProductReportComponent
  },
  {
    path: 'add',
    component: ProductReportAddComponent
  },
  {
    path: 'detail',
    component: ProductReportDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductReportRoutingModule {}
