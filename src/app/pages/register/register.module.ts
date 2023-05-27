import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RegisterRoutingModule } from './register-routing.module';
import { RegisterComponent } from './register.component';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegisterRoutingModule,
    FontAwesomeModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [RegisterComponent]
})
export class RegisterModule { }
