import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HelpCoffeeComponent } from './help-coffee.component';
import { HelpOrderComponent } from './help-order.component';
import { HelpPrintAndroidComponent } from './help-print-android.component';
import { HelpPrintIosComponent } from './help-print-ios.component';
import { HelpProductComponent } from './help-product.component';
import { HelpTableComponent } from './help-table.component';
import { HelpWebComponent } from './help-web.component';
import { HelpComponent } from './help.component';

const routes: Routes = [
  {
    path: '',
    component: HelpComponent,
  },
  {
    path: 'product',
    component: HelpProductComponent,
  },
  {
    path: 'order',
    component: HelpOrderComponent,
  },
  {
    path: 'table',
    component: HelpTableComponent,
  },
  {
    path: 'coffee',
    component: HelpCoffeeComponent,
  },
  {
    path: 'web',
    component: HelpWebComponent,
  },
  {
    path: 'print-android',
    component: HelpPrintAndroidComponent,
  },
  {
    path: 'print-ios',
    component: HelpPrintIosComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HelpRoutingModule {}
