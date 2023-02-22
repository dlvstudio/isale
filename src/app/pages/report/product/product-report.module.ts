import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ProductReportRoutingModule } from './product-report-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule, httpLoaderFactory } from '../../shared/shared.module';
import { ProductReportComponent } from './product-report.component';
import { ProductReportAddComponent } from './product-report-add.component';
import { ProductReportDetailComponent } from './product-report-detail.component';
import { NgChartsConfiguration, NgChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductReportRoutingModule,
    SharedModule,
    NgChartsModule,
    FontAwesomeModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [ProductReportComponent, ProductReportAddComponent, ProductReportDetailComponent],
  providers: [{ provide: NgChartsConfiguration, useValue: { generateColors: false }}]
})
export class ProductReportModule {}
