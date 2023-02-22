import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DebtComponent } from './debt.component';
import { DebtAddComponent } from './debt-add.component';
import { DebtDetailComponent } from './debt-detail.component';

const routes: Routes = [
  {
    path: '',
    component: DebtComponent
  },
  {
    path: 'add',
    component: DebtAddComponent
  },
  {
    path: 'detail',
    component: DebtDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DebtManagementPageRoutingModule {}
