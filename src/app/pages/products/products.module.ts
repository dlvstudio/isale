import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductsPageRoutingModule } from './products-routing.module';

import { ProductsPage } from './products.page';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ProductDetailComponent } from './product-detail.component';
import { ProductNoteItemComponent } from './product-note-item.component';
import { ProductAddComponent } from './product-add.component';
import { ProductImportComponent } from './product-import.component';
import { ProductNoteExportComponent } from './product-note-export.component';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { ProductQuickAddComponent } from './product-quick-add.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProductsExpiryComponent } from './products-expiry.component';
import { MaterialComponent } from './material.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductsPageRoutingModule,
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
  declarations: [ProductsPage,
    ProductDetailComponent,
    ProductAddComponent,
    ProductImportComponent,
    ProductQuickAddComponent,
    ProductNoteExportComponent,
    ProductsExpiryComponent,
    MaterialComponent,
    ProductNoteItemComponent],
  providers: [CurrencyPipe]
})
export class ProductsPageModule {}
