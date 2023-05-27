import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MoneyAccountRoutingModule } from './money-account-routing.module';
import { MoneyAccountComponent } from './money-account.component';
import { MoneyAccountDetailComponent } from './money-account-detail.component';
import { MoneyAccountAddComponent } from './money-account-add.component';
import { MoneyAccountTransferComponent } from './money-account-transfer.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoneyAccountRoutingModule,
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
  declarations: [MoneyAccountComponent, MoneyAccountDetailComponent, MoneyAccountAddComponent,
    MoneyAccountTransferComponent]
})
export class MoneyAccountModule {}
