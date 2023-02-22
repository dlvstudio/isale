import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TicketAddComponent } from './ticket-add.component';


const routes: Routes = [
  {
    path: 'add',
    component: TicketAddComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TicketRoutingModule {}
