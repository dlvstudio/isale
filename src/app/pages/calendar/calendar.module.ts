import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarComponent } from './calendar.component';
import { CalendarAddComponent } from './calendar-add.component';
import { CalendarDetailComponent } from './calendar-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalendarRoutingModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  entryComponents: [],
  declarations: [CalendarComponent, CalendarAddComponent, CalendarDetailComponent]
})
export class CalendarModule {}
