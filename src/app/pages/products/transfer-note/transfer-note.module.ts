import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { SharedModule, httpLoaderFactory } from '../../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TransferNoteAddComponent } from './transfer-note-add.component';
import { TransferNoteDetailPrintComponent } from './transfer-note-detail-print.component';
import { TransferNoteDetailShareComponent } from './transfer-note-detail-share.component';
import { TransferNoteDetailComponent } from './transfer-note-detail.component';
import { TransferNoteImportComponent } from './transfer-note-import.component';
import { TransferNoteProductEditComponent } from './transfer-note-product-edit.component';
import { TransferNoteRoutingModule } from './transfer-note-routing.module';
import { TransferNoteComponent } from './transfer-note.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TransferNoteRoutingModule,
    SharedModule,
    FontAwesomeModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  entryComponents: [TransferNoteProductEditComponent],
  declarations: [
    TransferNoteComponent,
    TransferNoteDetailComponent,
    TransferNoteProductEditComponent,
    TransferNoteAddComponent,
    TransferNoteImportComponent,
    TransferNoteDetailShareComponent,
    TransferNoteDetailPrintComponent
  ]
})
export class TransferNoteModule { }
