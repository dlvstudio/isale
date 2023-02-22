import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TradeAddComponent } from './trade-add.component';
import { TradeDetailComponent } from './trade-detail.component';
import { TradeRoutingModule } from './trade-routing.module';
import { TradeComponent } from './trade.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TradeRoutingModule,
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
  declarations: [TradeComponent, TradeAddComponent, TradeDetailComponent]
})
export class TradeModule {}
