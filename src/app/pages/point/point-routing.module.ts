import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LevelAddComponent } from './level-add.component';
import { PointAddComponent } from './point-add.component';
import { PointComponent } from './point.component';
import { SearchLevelComponent } from './search-level.component';


const routes: Routes = [
  {
    path: '',
    component: PointComponent
  },
  {
    path: 'add',
    component: PointAddComponent
  },
  {
    path: 'search-level',
    component: SearchLevelComponent
  },
  {
    path: 'add-level',
    component: LevelAddComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PointRoutingModule {}
