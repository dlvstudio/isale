import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuoteRoutingModule } from './quote-routing.module';
import { QuoteComponent } from './quote.component';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { QuoteAddComponent } from './quote-add.component';
import { QuoteDetailPrintComponent } from './quote-detail-print.component';
import { QuoteDetailComponent } from './quote-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QuoteRoutingModule,
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
  declarations: [QuoteComponent, QuoteDetailComponent, QuoteAddComponent, QuoteDetailPrintComponent]
})
export class QuoteModule {}
