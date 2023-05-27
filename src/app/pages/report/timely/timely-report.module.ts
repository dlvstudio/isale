import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TimelyReportRoutingModule } from './timely-report-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule, httpLoaderFactory } from '../../shared/shared.module';
import { TimelyReportAddComponent } from './report-add.component';
import { TimelyReportDetailComponent } from './report-detail.component';
import { NgChartsConfiguration, NgChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimelyReportRoutingModule,
    SharedModule,
    FontAwesomeModule,
    NgChartsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [TimelyReportAddComponent, TimelyReportDetailComponent],
  providers: [{ provide: NgChartsConfiguration, useValue: { generateColors: false }}]
})
export class TimelyReportModule {}
