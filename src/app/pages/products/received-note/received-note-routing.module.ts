import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReceivedNoteDetailComponent } from './received-note-detail.component';
import { ReceivedNoteAddComponent } from './received-note-add.component';
import { ReceivedNoteDetailPrintComponent } from './received-note-detail-print.component';
import { ReceivedNoteImportComponent } from './received-note-import.component';
import { ReceivedNoteComponent } from './received-note.component';
import { ReceivedNoteDetailShareComponent } from './received-note-detail-share.component';
import { NoteProductSelectorComponent } from '../note-product-selector.component';

const routes: Routes = [
  {
    path: '',
    component: ReceivedNoteComponent
  },
  {
    path: 'detail',
    component: ReceivedNoteDetailComponent
  },
  {
    path: 'add',
    component: ReceivedNoteAddComponent
  },
  {
    path: 'detail-print',
    component: ReceivedNoteDetailPrintComponent
  },
  {
    path: 'detail-share',
    component: ReceivedNoteDetailShareComponent
  },
  {
    path: 'note-product-selector',
    component: NoteProductSelectorComponent
  },
  {
    path: 'import',
    component: ReceivedNoteImportComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceivedNoteRoutingModule {}
