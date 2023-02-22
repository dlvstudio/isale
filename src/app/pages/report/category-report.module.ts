import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CategoryReportRoutingModule } from './category-report-routing.module';
import { SharedModule, httpLoaderFactory } from '../shared/shared.module';
import { CategoryReportComponent } from './category-report.component';
import { CategoryReportAddComponent } from './category-report-add.component';
import { CategoryReportDetailComponent } from './category-report-detail.component';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CategoryReportRoutingModule,
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
  declarations: [CategoryReportComponent, CategoryReportAddComponent, CategoryReportDetailComponent]
})
export class CategoryReportModule {}
