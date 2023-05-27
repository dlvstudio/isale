import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ChartRoutingModule } from './chart-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule, httpLoaderFactory } from '../../shared/shared.module';
import { NgChartsConfiguration, NgChartsModule } from 'ng2-charts';
import { ChartDetailComponent } from './chart-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChartRoutingModule,
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
  declarations: [ChartDetailComponent],
  providers: [{ provide: NgChartsConfiguration, useValue: { generateColors: false }}]
})
export class ChartModule {}
