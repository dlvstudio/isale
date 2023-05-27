import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoryComponent } from './category.component';
import { CategoryAddComponent } from './category-add.component';
import { CategoryDetailComponent } from './category-detail.component';
import { CategoryProductSelectorComponent } from '../products/category-product-selector.component';


const routes: Routes = [
  {
    path: '',
    component: CategoryComponent
  },
  {
    path: 'add',
    component: CategoryAddComponent
  },
  {
    path: 'detail',
    component: CategoryDetailComponent
  },
  {
    path: 'category-product-selector',
    component: CategoryProductSelectorComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CategoryRoutingModule {}
