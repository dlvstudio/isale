import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { DebtReportRoutingModule } from './debt-report-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule, httpLoaderFactory } from '../../shared/shared.module';
import { DebtReportComponent } from './debt-report.component';
import { DebtReportAddComponent } from './debt-report-add.component';
import { DebtReportDetailComponent } from './debt-report-detail.component';
import { NgChartsConfiguration, NgChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DebtReportRoutingModule,
    NgChartsModule,
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
  declarations: [DebtReportComponent, DebtReportAddComponent, DebtReportDetailComponent],
  providers: [{ provide: NgChartsConfiguration, useValue: { generateColors: false }}]
})
export class DebtReportModule {}
