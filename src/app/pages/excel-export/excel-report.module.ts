import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ExcelReportRoutingModule } from './excel-report-routing.module';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ExcelReportHomeComponent } from './excel-report-home.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExcelReportRoutingModule,
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
  declarations: [ExcelReportHomeComponent]
})
export class ExcelReportModule {}
