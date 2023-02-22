import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StoreSearchComponent } from './search-store.component';
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
  {
    path: 'search',
    component: StoreSearchComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StoreRoutingModule {}
