import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DebtManagementPageRoutingModule } from './debt-routing.module';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { DebtComponent } from './debt.component';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { DebtAddComponent } from './debt-add.component';
import { DebtDetailComponent } from './debt-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DebtManagementPageRoutingModule,
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
  declarations: [DebtComponent, DebtAddComponent, DebtDetailComponent]
})
export class DebtManagementPageModule {}
