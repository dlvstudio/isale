import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BusinessTypeAddComponent } from './business-type-add.component';
import { BusinessTypeComponent } from './business-type.component';

const routes: Routes = [
  {
    path: '',
    component: BusinessTypeComponent
  },
  {
    path: 'add',
    component: BusinessTypeAddComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BusinessTypeRoutingModule {}
