import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LevelConfigComponent } from './level-config.component';
import { LevelConfigAddComponent } from './level-config-add.component';


const routes: Routes = [
  {
    path: '',
    component: LevelConfigComponent
  },
  {
    path: 'add',
    component: LevelConfigAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LevelConfigRoutingModule {}
