import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DateRangeComponent } from '../shared/date-range.component';
import { OrderAddComponent } from './order-add.component';
import { OrderExportComponent } from './order-export.component';
import { OrderComponent } from './order.component';
import { OrderDetailComponent } from './order-detail.component';
import { OrderDetailPrintComponent } from './order-detail-print.component';
import { ProductSelectorComponent } from '../products/product-selector.component';
import { ProductOptionSelectorComponent } from '../products/product-option-selector.component';
import { OrderDetailPrintAlertComponent } from './order-detail-print-alert.component';
import { OrderImportComponent } from './order-import.component';
import { OrderMultiPrintComponent } from './order-multi-print.component';
import { QuoteSelectorComponent } from '../quote/quote-selector.component';

const routes: Routes = [
  {
    path: '',
    component: OrderComponent
  },
  {
    path: 'detail',
    component: OrderDetailComponent
  },
  {
    path: 'detail-print',
    component: OrderDetailPrintComponent
  },
  {
    path: 'multi-print',
    component: OrderMultiPrintComponent
  },
  {
    path: 'select-filter',
    component: DateRangeComponent
  },
  {
    path: 'print-alert',
    component: OrderDetailPrintAlertComponent
  },
  {
    path: 'add',
    component: OrderAddComponent
  },
  {
    path: 'export',
    component: OrderExportComponent
  },
  {
    path: 'import',
    component: OrderImportComponent
  },
  {
    path: 'product-selector',
    component: ProductSelectorComponent
  },
  {
    path: 'quote-selector',
    component: QuoteSelectorComponent
  },
  {
    path: 'option-selector',
    component: ProductOptionSelectorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderRoutingModule {}
