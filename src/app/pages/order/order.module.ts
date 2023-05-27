import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { OrderRoutingModule } from './order-routing.module';
import { OrderComponent } from './order.component';
import { OrderDetailComponent } from './order-detail.component';
import { OrderAddComponent } from './order-add.component';
import { OrderExportComponent } from './order-export.component';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { OrderDetailPrintComponent } from './order-detail-print.component';
import { OrderProductEditComponent } from './order-product-edit.component';
import { OrderDetailPrintAlertComponent } from './order-detail-print-alert.component';
import { OrderImportComponent } from './order-import.component';
import { OrderMultiPrintComponent } from './order-multi-print.component';
import { OrderPrintComponent } from './order-print.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrderRoutingModule,
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
  entryComponents: [OrderProductEditComponent],
  declarations: [OrderComponent, OrderDetailComponent, OrderAddComponent,
    OrderExportComponent, OrderDetailPrintComponent, OrderProductEditComponent, OrderPrintComponent,
    OrderDetailPrintAlertComponent, OrderImportComponent, OrderMultiPrintComponent]
})
export class OrderModule {}
