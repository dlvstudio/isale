import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ReceivedNoteRoutingModule } from './received-note-routing.module';
import { SharedModule, httpLoaderFactory } from '../../shared/shared.module';
import { ReceivedNoteComponent } from './received-note.component';
import { ReceivedNoteDetailComponent } from './received-note-detail.component';
import { ReceivedNoteAddComponent } from './received-note-add.component';
import { ReceivedNoteImportComponent } from './received-note-import.component';
import { ReceivedNoteDetailPrintComponent } from './received-note-detail-print.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ReceivedNoteProductEditComponent } from './received-note-product-edit.component';
import { ReceivedNoteDetailShareComponent } from './received-note-detail-share.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReceivedNoteRoutingModule,
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
  entryComponents: [ReceivedNoteProductEditComponent],
  declarations: [
    ReceivedNoteComponent,
    ReceivedNoteDetailComponent,
    ReceivedNoteProductEditComponent,
    ReceivedNoteAddComponent,
    ReceivedNoteImportComponent,
    ReceivedNoteDetailShareComponent,
    ReceivedNoteDetailPrintComponent
  ]
})
export class ReceivedNoteModule { }
