import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TransferProductSelectorComponent } from '../transfer-product-selector.component';
import { TransferNoteAddComponent } from './transfer-note-add.component';
import { TransferNoteDetailPrintComponent } from './transfer-note-detail-print.component';
import { TransferNoteDetailShareComponent } from './transfer-note-detail-share.component';
import { TransferNoteDetailComponent } from './transfer-note-detail.component';
import { TransferNoteImportComponent } from './transfer-note-import.component';
import { TransferNoteComponent } from './transfer-note.component';

const routes: Routes = [
  {
    path: '',
    component: TransferNoteComponent
  },
  {
    path: 'detail',
    component: TransferNoteDetailComponent
  },
  {
    path: 'add',
    component: TransferNoteAddComponent
  },
  {
    path: 'detail-print',
    component: TransferNoteDetailPrintComponent
  },
  {
    path: 'detail-share',
    component: TransferNoteDetailShareComponent
  },
  {
    path: 'transfer-product-selector',
    component: TransferProductSelectorComponent
  },
  {
    path: 'import',
    component: TransferNoteImportComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransferNoteRoutingModule {}
