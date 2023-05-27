import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { DebtItemComponent } from '../debt-management/debt-item.component';
import { DateRangeComponent } from './date-range.component';
import { GalleryComponent } from './gallery.component';
import { PeriodRangeComponent } from './period-range.component';
import { OrderListItemComponent } from '../order/order-list-item.component';
import { ShareSelectComponent } from '../share/share-select.component';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DateItemComponent } from './date-item.component';
import { ReceivedNoteListItemComponent } from '../products/received-note/received-note-list-item.component';
import { BarcodeInputComponent } from './barcode-input.component';
import { ProductSelectorComponent } from '../products/product-selector.component';
import { ProductOptionSelectorComponent } from '../products/product-option-selector.component';
import { ProductAttributeAddComponent } from '../products/product-attribute-add.component';
import { ProductAttributeComponent } from '../products/product-attribute.component';
import { ProductAttributeSelectorComponent } from '../products/product-attribute-selector.component';
import { SupportComponent } from './support.component';
import { TradeItemComponent } from './trade-item.component';
import { RateComponent } from './rate.component';
import { TipComponent } from './tip.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MoneyInputComponent } from './money-input.component';
import { SuggestionComponent } from './suggestion.component';
import { DatePickerComponent } from './date-picker.component';
import { CustomerPriceItemComponent } from '../customer-price/customer-price-item.component';
import { CustomerDiscountItemComponent } from '../customer-discount/customer-discount-item.component';
import { ProductTypeComponent } from '../products/product-type.component';
import { ProductTypeAddComponent } from '../products/product-type-add.component';
import { ProductTypeValueAddComponent } from '../products/product-type-value-add.component';
import { ProductTypeSelectorComponent } from '../products/product-type-selector.component';
import { ProductBarcodeAddComponent } from '../products/product-barcode-add.component';
import { ProductBarcodeComponent } from '../products/product-barcode.component';
import { TransferNoteListItemComponent } from '../products/transfer-note/transfer-note-list-item.component';
import { NoteProductSelectorComponent } from '../products/note-product-selector.component';
import { TransferProductSelectorComponent } from '../products/transfer-product-selector.component';
import { CategoryProductSelectorComponent } from '../products/category-product-selector.component';
import { ProductSelectorItemComponent } from '../products/product-selector-item.component';
import { OnlineOrderListItemComponent } from '../online-order/online-order-list-item.component';
import { QuoteListItemComponent } from '../quote/quote-list-item.component';
import { QuoteSelectorComponent } from '../quote/quote-selector.component';
import { QuoteSelectorItemComponent } from '../quote/quote-selector-item.component';
import { ListComponent } from './list.component';
import { ListOnlyComponent } from './list-only.component';
import { FormAddComponent } from './form-add.component';
import { FormImageComponent } from './form-image.component';

export function httpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FontAwesomeModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  exports: [
    DebtItemComponent,
    TradeItemComponent,
    ProductSelectorComponent,
    QuoteSelectorComponent,
    NoteProductSelectorComponent,
    TransferProductSelectorComponent,
    CategoryProductSelectorComponent,
    ProductTypeSelectorComponent,
    ProductOptionSelectorComponent,
    ProductAttributeComponent,
    ProductTypeValueAddComponent,
    ProductAttributeAddComponent,
    ProductAttributeSelectorComponent,
    DateRangeComponent,
    PeriodRangeComponent,
    OrderListItemComponent,
    QuoteListItemComponent,
    OnlineOrderListItemComponent,
    ShareSelectComponent,
    ReceivedNoteListItemComponent,
    TransferNoteListItemComponent,
    BarcodeInputComponent,
    DateItemComponent,
    SupportComponent,
    RateComponent,
    TipComponent,
    MoneyInputComponent,
    SuggestionComponent,
    CustomerPriceItemComponent,
    CustomerDiscountItemComponent,
    ProductBarcodeComponent,
    ProductBarcodeAddComponent,
    ProductSelectorItemComponent,
    QuoteSelectorItemComponent,
    DatePickerComponent,
    ListComponent,
    ListOnlyComponent,
    FormAddComponent,
    FormImageComponent,
    GalleryComponent
  ],
  entryComponents: [
    DebtItemComponent,
    TradeItemComponent,
    ProductSelectorComponent,
    QuoteSelectorComponent,
    NoteProductSelectorComponent,
    TransferProductSelectorComponent,
    CategoryProductSelectorComponent,
    ProductTypeSelectorComponent,
    ProductOptionSelectorComponent,
    ProductAttributeComponent,
    ProductTypeValueAddComponent,
    ProductAttributeAddComponent,
    ProductAttributeSelectorComponent,
    DateRangeComponent,
    PeriodRangeComponent,
    OrderListItemComponent,
    QuoteListItemComponent,
    OnlineOrderListItemComponent,
    ShareSelectComponent,
    ReceivedNoteListItemComponent,
    TransferNoteListItemComponent,
    BarcodeInputComponent,
    DateItemComponent,
    SupportComponent,
    RateComponent,
    TipComponent,
    MoneyInputComponent,
    SuggestionComponent,
    CustomerPriceItemComponent,
    CustomerDiscountItemComponent,
    ProductBarcodeComponent,
    ProductBarcodeAddComponent,
    ProductSelectorItemComponent,
    QuoteSelectorItemComponent,
    DatePickerComponent,
    ListComponent,
    ListOnlyComponent,
    FormAddComponent,
    FormImageComponent,
    GalleryComponent
  ],
  declarations: [
    DebtItemComponent,
    TradeItemComponent,
    ProductSelectorComponent,
    QuoteSelectorComponent,
    NoteProductSelectorComponent,
    TransferProductSelectorComponent,
    CategoryProductSelectorComponent,
    ProductTypeSelectorComponent,
    ProductOptionSelectorComponent,
    ProductAttributeComponent,
    ProductTypeComponent,
    ProductTypeValueAddComponent,
    ProductAttributeAddComponent,
    ProductTypeAddComponent,
    ProductAttributeSelectorComponent,
    DateRangeComponent,
    PeriodRangeComponent,
    OrderListItemComponent,
    QuoteListItemComponent,
    OnlineOrderListItemComponent,
    ShareSelectComponent,
    ReceivedNoteListItemComponent,
    TransferNoteListItemComponent,
    BarcodeInputComponent,
    DateItemComponent,
    SupportComponent,
    RateComponent,
    TipComponent,
    MoneyInputComponent,
    SuggestionComponent,
    CustomerPriceItemComponent,
    CustomerDiscountItemComponent,
    ProductBarcodeComponent,
    ProductBarcodeAddComponent,
    ProductSelectorItemComponent,
    QuoteSelectorItemComponent,
    DatePickerComponent,
    ListComponent,
    ListOnlyComponent,
    FormAddComponent,
    FormImageComponent,
    GalleryComponent
  ]
})
export class SharedModule { }
