import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MoneyAccountDetailComponent } from './money-account-detail.component';
import { MoneyAccountAddComponent } from './money-account-add.component';
import { MoneyAccountTransferComponent } from './money-account-transfer.component';
import { MoneyAccountComponent } from './money-account.component';


const routes: Routes = [
  {
    path: '',
    component: MoneyAccountComponent
  },
  {
    path: 'detail',
    component: MoneyAccountDetailComponent
  },
  {
    path: 'add',
    component: MoneyAccountAddComponent
  },
  {
    path: 'transfer',
    component: MoneyAccountTransferComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoneyAccountRoutingModule {}
