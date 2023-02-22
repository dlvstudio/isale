import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ReportRoutingModule } from './report-routing.module';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ReportHomeComponent } from './report-home.component';
import { ReportDetailComponent } from './report-detail.component';
import { ReportAddComponent } from './report-add.component';
import { NgChartsConfiguration, NgChartsModule, ThemeService } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportRoutingModule,
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
  providers: [ThemeService, { provide: NgChartsConfiguration, useValue: { generateColors: false }}],
  declarations: [ReportHomeComponent, ReportDetailComponent, ReportAddComponent],
})
export class ReportModule {}
