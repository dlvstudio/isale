import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TableAddComponent } from './shop-table-add.component';
import { TableDetailComponent } from './shop-table-detail.component';
import { TableComponent } from './shop-table.component';


const routes: Routes = [
  {
    path: '',
    component: TableComponent
  },
  {
    path: 'add',
    component: TableAddComponent
  },
  {
    path: 'detail',
    component: TableDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TableRoutingModule {}
