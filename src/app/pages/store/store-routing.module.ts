import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StoreAddComponent } from './store-add.component';
import { StoreDetailComponent } from './store-detail.component';
import { StoreComponent } from './store.component';


const routes: Routes = [
  {
    path: '',
    component: StoreComponent
  },
  {
    path: 'add',
    component: StoreAddComponent
  },
  {
    path: 'detail',
    component: StoreDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StoreRoutingModule {}
