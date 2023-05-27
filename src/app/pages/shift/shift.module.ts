import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { SharedModule, httpLoaderFactory } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ShiftRoutingModule } from './shift-routing.module';
import { ShiftAddComponent } from './shift-add.component';
import { ShiftComponent } from './shift.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShiftRoutingModule,
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
  declarations: [ShiftAddComponent, ShiftComponent]
})
export class ShiftModule {}
