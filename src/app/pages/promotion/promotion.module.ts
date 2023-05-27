import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { PromotionRoutingModule } from './promotion-routing.module';
import { PromotionComponent } from './promotion.component';
import { PromotionAddComponent } from './promotion-add.component';
import { PromotionDetailComponent } from './promotion-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PromotionRoutingModule,
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
  declarations: [PromotionComponent, PromotionAddComponent, PromotionDetailComponent]
})
export class PromotionModule {}
