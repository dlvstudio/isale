import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { RequestProRoutingModule } from './request-pro-routing.module';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RequestProComponent } from './request-pro.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RequestProRoutingModule,
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
  declarations: [RequestProComponent]
})
export class RequestProModule {}
