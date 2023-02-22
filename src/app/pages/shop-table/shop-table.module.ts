import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { TableRoutingModule } from './shop-table-routing.module';
import { TableComponent } from './shop-table.component';
import { TableAddComponent } from './shop-table-add.component';
import { TableDetailComponent } from './shop-table-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TableRoutingModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  entryComponents: [],
  declarations: [TableComponent, TableAddComponent, TableDetailComponent]
})
export class TableModule {}
