import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NoteComponent } from './note.component';
import { NoteAddComponent } from './note-add.component';
import { NoteDetailComponent } from './note-detail.component';


const routes: Routes = [
  {
    path: '',
    component: NoteComponent
  },
  {
    path: 'detail',
    component: NoteDetailComponent
  },
  {
    path: 'add',
    component: NoteAddComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NoteRoutingModule {}
