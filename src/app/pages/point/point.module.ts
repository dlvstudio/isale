import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { PointRoutingModule } from './point-routing.module';
import { PointComponent } from './point.component';
import { PointAddComponent } from './point-add.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PointRoutingModule,
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
  declarations: [PointComponent, PointAddComponent]
})
export class PointModule {}
