import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { SurveyRoutingModule } from './survey-routing.module';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SurveyComponent } from './survey.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SurveyRoutingModule,
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
  declarations: [SurveyComponent]
})
export class SurveyModule {}
