import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PromotionAddComponent } from './promotion-add.component';
import { PromotionDetailComponent } from './promotion-detail.component';
import { PromotionComponent } from './promotion.component';


const routes: Routes = [
  {
    path: '',
    component: PromotionComponent
  },
  {
    path: 'add',
    component: PromotionAddComponent
  },
  {
    path: 'detail',
    component: PromotionDetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PromotionRoutingModule {}
