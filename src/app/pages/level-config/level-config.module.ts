import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { LevelConfigComponent } from './level-config.component';
import { LevelConfigAddComponent } from './level-config-add.component';
import { LevelConfigRoutingModule } from './level-config-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LevelConfigRoutingModule,
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
  declarations: [LevelConfigComponent, LevelConfigAddComponent]
})
export class LevelConfigModule {}
