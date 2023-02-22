import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductSelectorComponent } from '../products/product-selector.component';
import { ProductOptionSelectorComponent } from '../products/product-option-selector.component';
import { DateRangeComponent } from '../shared/date-range.component';
import { OnlineOrderDetailComponent } from './online-order-detail.component';
import { OnlineOrderComponent } from './online-order.component';

const routes: Routes = [
  {
    path: '',
    component: OnlineOrderComponent
  },
  {
    path: 'detail',
    component: OnlineOrderDetailComponent
  },
  {
    path: 'select-filter',
    component: DateRangeComponent
  },
  {
    path: 'product-selector',
    component: ProductSelectorComponent
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
export class OnlineOrderRoutingModule {}
