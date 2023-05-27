import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { SharedModule, httpLoaderFactory } from '../shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { StaffRoutingModule } from './staff-routing.module';
import { StaffComponent } from './staff.component';
import { StaffAddComponent } from './staff-add.component';
import { StaffDetailComponent } from './staff-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StaffRoutingModule,
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
  declarations: [StaffComponent, StaffAddComponent, StaffDetailComponent]
})
export class StaffModule {}
