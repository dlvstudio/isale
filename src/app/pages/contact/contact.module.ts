import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ContactRoutingModule } from './contact-routing.module';
import { ContactComponent } from './contact.component';
import { ContactAddComponent } from './contact-add.component';
import { ContactDetailComponent } from './contact-detail.component';
import { SharedModule, httpLoaderFactory } from '../shared/shared.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ContactImportComponent } from './contact-import.component';
import { ContactQuickAddComponent } from './contact-quick-add.component';
import { CustomerPriceAddComponent } from '../customer-price/customer-price-add.component';
import { CustomerDiscountAddComponent } from '../customer-discount/customer-discount-add.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditPointComponent } from './edit-point.component';
import { ContactMobileImportComponent } from './contact-mobile-import.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    FontAwesomeModule,
    ContactRoutingModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [ContactComponent,
    ContactQuickAddComponent,
    ContactAddComponent,
    ContactDetailComponent,
    CustomerPriceAddComponent,
    CustomerDiscountAddComponent,
    EditPointComponent,
    ContactMobileImportComponent,
    ContactImportComponent]
})
export class ContactModule { }
