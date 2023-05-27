import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QuoteAddComponent } from './quote-add.component';
import { QuoteComponent } from './quote.component';
import { QuoteDetailComponent } from './quote-detail.component';
import { QuoteDetailPrintComponent } from './quote-detail-print.component';
import { ProductSelectorComponent } from '../products/product-selector.component';
import { ProductOptionSelectorComponent } from '../products/product-option-selector.component';
import { DateRangeComponent } from '../shared/date-range.component';

const routes: Routes = [
  {
    path: '',
    component: QuoteComponent
  },
  {
    path: 'detail',
    component: QuoteDetailComponent
  },
  {
    path: 'detail-print',
    component: QuoteDetailPrintComponent
  },
  {
    path: 'select-filter',
    component: DateRangeComponent
  },
  {
    path: 'add',
    component: QuoteAddComponent
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
export class QuoteRoutingModule {}
