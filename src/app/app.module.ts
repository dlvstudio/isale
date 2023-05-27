/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { NgModule } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LocationStrategy, HashLocationStrategy, CurrencyPipe } from '@angular/common';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { IonicStorageModule } from '@ionic/storage-angular';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { httpLoaderFactory, SharedModule } from './pages/shared/shared.module';
import { AnalyticsService } from './providers/analytics.service';
import { ApiService } from './providers/api.service';
import { CalendarService } from './providers/calendar.service';
import { ContactService } from './providers/contact.service';
import { DataService } from './providers/data.service';
import { DebtService } from './providers/debt.service';
import { ExcelService } from './providers/excel.service';
import { FcmTokenService } from './providers/fcmtoken.service';
import { IonicGestureConfig } from './providers/ionic-gesture-config';
import { MoneyAccountTransactionService } from './providers/money-account-transaction.service';
import { MoneyAccountService } from './providers/money-account.service';
import { NoteService } from './providers/note.service';
import { OrderService } from './providers/order.service';
import { PlanService } from './providers/plan.service';
import { PointService } from './providers/point.service';
import { ProductService } from './providers/product.service';
import { ReceivedNoteService } from './providers/received-note.service';
import { ReportService } from './providers/report.service';
import { RouteHelperService } from './providers/route-helper.service';
import { ShopTableService } from './providers/shop-table.service';
import { StaffService } from './providers/staff.service';
import { StorageService } from './providers/storage.service';
import { StoreService } from './providers/store.service';
import { TicketService } from './providers/ticket.service';
import { TradeService } from './providers/trade.service';
import { TransferNoteService } from './providers/transfer-note.service';
import { UserService } from './providers/user.service';
import { ShiftService } from './providers/shift.service';
import { OmniChannelService } from './providers/omni-channel.service';
import { ActivityService } from './providers/activity.service';
import { QuoteService } from './providers/quote.service';
import { PromotionService } from './providers/promotion.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule,
    SharedModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    Location, { provide: LocationStrategy, useClass: HashLocationStrategy },
    StatusBar,
    BarcodeScanner,
    File,
    AndroidPermissions,
    FileTransfer,
    HTTP,
    Printer,
    Camera,
    SocialSharing,
    CurrencyPipe,
    FirebaseX,
    InAppBrowser,
    AppRate,
    RouteHelperService,
    StorageService,
    AnalyticsService,
    ApiService,
    UserService,
    DebtService,
    ProductService,
    TradeService,
    StaffService,
    ExcelService,
    NoteService,
    DataService,
    OrderService,
    ContactService,
    MoneyAccountService,
    ReceivedNoteService,
    MoneyAccountTransactionService,
    TicketService,
    ReportService,
    ShopTableService,
    CalendarService,
    FcmTokenService,
    PlanService,
    StoreService,
    PointService,
    TransferNoteService,
    ShiftService,
    OmniChannelService,
    ActivityService,
    QuoteService,
    PromotionService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HAMMER_GESTURE_CONFIG, useClass: IonicGestureConfig }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(library: FaIconLibrary) {
      library.addIconPacks(fas, fab, far);
  }
}
