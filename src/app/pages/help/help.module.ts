import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { HelpRoutingModule } from './help-routing.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HelpComponent } from './help.component';
import { HelpProductComponent } from './help-product.component';
import { HelpOrderComponent } from './help-order.component';
import { HelpTableComponent } from './help-table.component';
import { HelpCoffeeComponent } from './help-coffee.component';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { HelpWebComponent } from './help-web.component';
import { HelpPrintAndroidComponent } from './help-print-android.component';
import { HelpPrintIosComponent } from './help-print-ios.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelpRoutingModule,
    FontAwesomeModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [
    HelpComponent,
    HelpProductComponent,
    HelpOrderComponent,
    HelpTableComponent,
    HelpCoffeeComponent,
    HelpWebComponent,
    HelpPrintAndroidComponent,
    HelpPrintIosComponent,
  ]
})
export class HelpModule { }
