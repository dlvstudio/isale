import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { StoreRoutingModule } from './store-routing.module';
import { StoreAddComponent } from './store-add.component';
import { StoreDetailComponent } from './store-detail.component';
import { StoreComponent } from './store.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StoreRoutingModule,
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
  declarations: [StoreComponent, StoreAddComponent, StoreDetailComponent]
})
export class StoreModule {}
