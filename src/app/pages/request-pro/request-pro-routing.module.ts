import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RequestProComponent } from './request-pro.component';


const routes: Routes = [
  {
    path: '',
    component: RequestProComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestProRoutingModule {}
