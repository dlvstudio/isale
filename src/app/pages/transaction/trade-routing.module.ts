import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TradeDetailComponent } from './trade-detail.component';
import { TradeAddComponent } from './trade-add.component';
import { TradeComponent } from './trade.component';


const routes: Routes = [
  {
    path: '',
    component: TradeComponent
  },
  {
    path: 'detail',
    component: TradeDetailComponent
  },
  {
    path: 'add',
    component: TradeAddComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TradeRoutingModule {}
