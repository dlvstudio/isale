import { Component, OnInit } from '@angular/core';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { IProduct } from '../../models/product.interface';
import { IMoneyAccount } from '../../models/money-account.interface';
import { IStaff } from '../../models/staff.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { Platform, AlertController, ModalController } from '@ionic/angular';
import { ProductService } from '../../providers/product.service';
import { MoneyAccountService } from '../../providers/money-account.service';
import { UserService } from '../../providers/user.service';
import { DataService } from '../../providers/data.service';
import { StaffService } from '../../providers/staff.service';
import { TranslateService } from '@ngx-translate/core';
import { AdMob } from '@capacitor-community/admob';
import { AnalyticsService } from '../../providers/analytics.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { Helper } from '../../providers/helper.service';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { FcmTokenService } from '../../providers/fcmtoken.service';
import { PlanService } from '../../providers/plan.service';
import { DateTimeService } from '../../providers/datetime.service';
import { StorageService } from '../../providers/storage.service';
import { StoreService } from '../../providers/store.service';
import { OmniChannelService } from '../../providers/omni-channel.service';

declare let AppRate;
declare let FirebasePlugin;

@Component({
    selector: 'home',
    templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
    public hasMoneyAccount = true;
    public hasShop = true;
    shop: any;
    isOnTrial: any;
    trialAlert: string;
    staffsToSelect: IStaff[] = [];
    public loading = true;
    public hasSelectedStaff = false;
    public selectedStaff: IStaff = null;
    isMobile = false;
    currentPlan;
    proPlan;
    checkOrder = 0;
    store;
    proPlanExpiredAlert;
    fontSizeSmall = false;
    hideTablesFunction = false;
    hideCalendarFunction = false;
    hideMaterials = false;
    tab = 'selling';
    hasRecentNoti = false;

    constructor(
        private platform: Platform,
        private storage: StorageService,
        public navCtrl: RouteHelperService,
        private barcodeScanner: BarcodeScanner,
        private alertCtrl: AlertController,
        private modalCtrl: ModalController,
        private productService: ProductService,
        private moneyAccountService: MoneyAccountService,
        private socialSharing: SocialSharing,
        public userService: UserService,
        private dataService: DataService,
        private staffService: StaffService,
        private translate: TranslateService,
        private analyticsService: AnalyticsService,
        private firebase: FirebaseX,
        private storeService: StoreService,
        private fcmTokenService: FcmTokenService,
        private omniChannelService: OmniChannelService,
        private planService: PlanService,
    ) {
        this.navCtrl.unsubscribe('reloadHome', this.reload);
        this.navCtrl.subscribe('reloadHome', this.reload);
        this.navCtrl.unsubscribe('reloadHomeConfig', this.reloadConfig);
        this.navCtrl.subscribe('reloadHomeConfig', this.reloadConfig);
    }

    reloadRecentNoti = (event) => {
        this.hasRecentNoti = event.detail;
    }

    async ngOnInit() {
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        await this.reload();
    }

    ionViewWillLeave() {
        this.navCtrl.unsubscribe('recentNoti', this.reloadRecentNoti);
    }

    async ionViewWillEnter() {
        this.hasRecentNoti = await this.omniChannelService.gotRecentNoti();
        this.navCtrl.subscribe('recentNoti', this.reloadRecentNoti);
        await this.analyticsService.setCurrentScreen('home');
    }

    reload = async () => {
        if (!this.staffService.hasChooseStaff) {
            this.staffService.checkPermissions().then((staffs) => {
                if (!staffs || !staffs.length) {
                    this.staffService.hasChooseStaff = true;
                    this.staffService.selectedStaff = null;
                    this.hasSelectedStaff = true;
                    this.loading = false;
                    return;
                }
                this.staffsToSelect = staffs;
                this.staffService.staffsToSelect = staffs;
                this.loading = false;
                this.hasSelectedStaff = false;
            });
        } else {
            this.hasSelectedStaff = this.staffService.hasChooseStaff;
            this.selectedStaff = this.staffService.selectedStaff;
            this.loading = false;
        }
        this.moneyAccountService.getDefault().then((acc: IMoneyAccount) => {
            if (!acc) {
                this.hasMoneyAccount = false;
            } else {
                this.hasMoneyAccount = true;
            }
        });
        this.fontSizeSmall = await this.userService.checkFontSizeSmall();
        await this.checkCurrentPlan();
        await this.checkNewVersion();
        this.checkNotifications();
        await this.reloadConfig();
    }

    reloadConfig = async () => {
        this.hideTablesFunction = await this.userService.getHideTablesFunction();
        this.hideCalendarFunction = await this.userService.getHideCalendarFunction();
        this.hideMaterials = await this.userService.getHideMaterials();
    }

    async checkCurrentPlan() {
        this.shop = await this.dataService.getFirstObject('shop');
        if (!this.shop) {
            this.hasShop = false;
        } else {
            this.hasShop = true;
        }
        const shopCreatedAt = this.shop ? new Date(this.shop.createdAt) : null;
        let shopCreatedAtPlus6 = null;
        if (shopCreatedAt) {
            shopCreatedAtPlus6 = new Date(this.shop.createdAt);
            shopCreatedAtPlus6.setDate(shopCreatedAtPlus6.getDate() + 6);
        }
        const currentDateMinus6 = new Date();
        currentDateMinus6.setDate(currentDateMinus6.getDate() - 6);
        this.currentPlan = await this.planService.getCurrentPlan();
        const hasPlanStr = await this.storage.get('has-plan-' + this.shop.id);
        if ((!hasPlanStr || hasPlanStr !== '1') &&  this.currentPlan) {
            await this.storage.set('has-plan-' + this.shop.id, '1');
            this.analyticsService.logEvent('request-pro-upgraded');
        }
        this.isOnTrial = !this.currentPlan && shopCreatedAt && (shopCreatedAt >= currentDateMinus6);
        if (this.isOnTrial) {
            this.trialAlert = this.translate.instant('home.pro-trial-alert', { date: this.dateFormat(shopCreatedAtPlus6) });
            const firstTrialAlert = await this.storage.get('first-trial-alert-' + this.shop.id);
            if (!firstTrialAlert || firstTrialAlert !== '1') {
                const confirm = await this.alertCtrl.create({
                    header: this.translate.instant('common.confirm'),
                    message: this.trialAlert,
                    buttons: [
                        {
                            text: this.translate.instant('common.agree'),
                            handler: () => {
                            }
                        },
                    ]
                });
                await confirm.present();
                await this.storage.set('first-trial-alert-' + this.shop.id, '1');
            }
        }
        if (this.currentPlan) {
            const start = this.dateFormat(this.currentPlan.startDate);
            const end = this.dateFormat(this.currentPlan.endDate);
            const endDate = new Date(this.currentPlan.endDate);
            const currentDatePlus7 = new Date();
            currentDatePlus7.setDate(currentDatePlus7.getDate() + 7);
            const dismissExpired = await this.storage.get('pro-plan-expired-dismiss-' + end);
            if (endDate <= currentDatePlus7) {
                this.proPlanExpiredAlert = this.translate.instant('home.pro-plan-expired-alert', { date: end });
            }
            if (endDate <= currentDatePlus7 && dismissExpired !== '1') {
                const confirm = await this.alertCtrl.create({
                    header: this.translate.instant('common.confirm'),
                    message: this.proPlanExpiredAlert,
                    buttons: [
                        {
                            text: this.translate.instant('home.pro-plan-expired-dismiss'),
                            handler: async () => {
                                await this.storage.set('pro-plan-expired-dismiss-' + end, '1');
                            }
                        },
                        {
                            text: this.translate.instant('common.agree'),
                            handler: () => {
                            }
                        },
                    ]
                });
                await confirm.present();
            }
            this.proPlan = await this.translate.instant('home.pro-plan', { start, end });
            await this.removeBanner();
        } else {
            this.checkOrder = await this.planService.checkOrder();
        }
    }

    async setFontSize() {
        this.fontSizeSmall = !this.fontSizeSmall;
        await this.userService.setFontSizeSmall(this.fontSizeSmall);
    }

    async checkNewVersion() {
        const oldVersion = await this.storage.get('new-version');
        const newVersion = this.translate.instant('common.new-feature');
        if (oldVersion !== newVersion) {
            const alert = await this.alertCtrl.create({
                header: this.translate.instant('common.new-feature-title'),
                message: this.translate.instant('common.new-feature'),
                buttons: ['OK']
            });
            await alert.present();
            await this.storage.set('new-version', newVersion);
        }
    }

    async removeBanner() {
        if (!this.platform.is('ios') && !this.platform.is('android')) {
            return;
        }
        if (this.currentPlan && this.currentPlan.isTrial) {
            return;
        }
        this.navCtrl.setHasAds(false);
        await AdMob.hideBanner().then((res) => {
        }, (err) => {
            console.error(err);
        }).catch((err) => {
            console.error(err);
        });
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    configShop() {
        this.navCtrl.push('/config', null);
    }

    async openAppAndroid() {
        this.analyticsService.logEvent('open-app-on-home');
        this.navCtrl.openExternalUrl('https://play.google.com/store/apps/details?id=com.dlv.isale');
    }

    async scanForOrder(): Promise<void> {
        if (!this.currentPlan && this.checkOrder >= 10 && !this.isOnTrial) {
            this.analyticsService.logEvent('home-check-order-alert');
            alert(this.translate.instant('order.check-order-alert', { total: this.checkOrder }));
            return;
        }
        this.analyticsService.logEvent('home-scan-for-order');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.analyticsService.logEvent('home-scan-for-order-scanned-web');
                this.doEnteredBarcode(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.analyticsService.logEvent('home-scan-for-order-scanned');
            this.doEnteredBarcode(barcodeData.text);
        }).catch((err) => {
            console.error(err);
        });
    }

    doEnteredBarcode = (barcode) => {
        if (!barcode) {
            return;
        }
        this.productService.searchByBarcode(barcode).then((product: IProduct) => {
            if (product) {
                this.analyticsService.logEvent('home-scan-for-order-scanned-ok');
                this.navCtrl.push('/order/add', { product: product.id, fromUnit: product.fromUnit });
                return;
            }
        });
    }

    newTrade(): void {
        this.navCtrl.push('/trade/add', null);
    }

    newOrder(): void {
        if (!this.currentPlan && this.checkOrder >= 10 && !this.isOnTrial) {
            this.analyticsService.logEvent('check-order-alert');
            alert(this.translate.instant('order.check-order-alert', { total: this.checkOrder }));
            return;
        }
        this.navCtrl.push('/order/add', null);
    }

    viewMoneyAccounts(): void {
        this.navCtrl.push('/money-account', null);
    }

    viewTrades(): void {
        this.navCtrl.push('/trade', null);
    }

    viewDebts(): void {
        this.navCtrl.push('/debt', { page: 'debts' });
    }

    viewCategories(): void {
        this.navCtrl.push('/category', null);
    }

    showPoint(): void {
        if (!this.currentPlan && !this.isOnTrial) {
            this.analyticsService.logEvent('point-check-pro-alert');
            alert(this.translate.instant('point.check-pro-alert'));
            return;
        }
        this.navCtrl.push('/point', null);
    }

    viewReports(): void {
        this.navCtrl.push('/excel-report', null);
    }

    viewOrders(): void {
        this.navCtrl.push('/order', null);
    }

    viewOnlineOrders(): void {
        this.navCtrl.push('/online-order', null);
    }

    viewContacts(): void {
        this.navCtrl.push('/contact', null);
    }

    viewNotes(): void {
        this.navCtrl.push('/note', null);
    }

    viewStaffs(): void {
        this.navCtrl.push('/staff', null);
    }

    sendTicket(): void {
        this.navCtrl.push('/ticket/add', null);
    }

    viewReceivedNotes(): void {
        this.navCtrl.push('/received-note', null);
    }

    viewTransferNotes() {
        this.navCtrl.push('/transfer-note', null);
    }

    scanNewProduct(): void {
        if (!(this.platform.is('capacitor') || this.platform.is('cordova'))) {
            const r = Math.random().toString(36).substring(7);
            this.navCtrl.push('/product/edit', { barcode: r });
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.productService.searchByBarcode(barcodeData.text).then((product: IProduct) => {
                if (product) {
                    this.navCtrl.push('/product/detail', { id: product.id });
                    return;
                }
                this.navCtrl.push('/product/edit', { barcode: barcodeData.text });
            });
        }).catch((err) => {
            console.error(err);
        });
    }

    viewProducts(): void {
        this.navCtrl.push('/product', null);
    }

    viewMaterials() {
        this.navCtrl.push('/product/material', null);
    }

    viewHelps() {
        this.navCtrl.push('/help', null);
    }

    rate(): void {
        this.analyticsService.logEvent('home-rate');
        if (typeof AppRate === 'undefined') {
            return;
        }
        AppRate.promptForRating(true);
    }

    share(): void {
        this.analyticsService.logEvent('home-share');
        const body = this.translate.instant('share.body');
        const subject = this.translate.instant('share.subject');
        const linkAndroid = this.translate.instant('share.link-android');
        const linkIos = this.translate.instant('share.link-android');
        const link = this.platform.is('ios')
            ? linkIos
            : linkAndroid;
        this.socialSharing.share(body, subject, [], link).then(async () => {
            const confirm = await this.alertCtrl.create({
                header: this.translate.instant('share.share'),
                message: this.translate.instant('share.thank-you'),
                buttons: [
                    {
                        text: this.translate.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
        }).catch(() => {
            // Error!
        });
    }

    createDefaultWallet(): void {
        this.navCtrl.push('/money-account/add');
    }

    async selectShop(staff: IStaff): Promise<void> {
        this.staffService.selectedStaff = staff;
        this.staffService.hasChooseStaff = true;
        this.hasSelectedStaff = true;
        this.selectedStaff = staff;
        this.userService.setLoggedUser(this.userService.loggedUser);
        if (staff.store) {
            this.storeService.loginAsStore(staff.store);
        }
        await this.getShopConfig();
        await this.checkCurrentPlan();
        if (this.navCtrl.isNotCordova()) {
            return;
        }
        this.firebase.getToken().then(async (token) => {
            await this.fcmTokenService.saveToken(token);
        }, (err) => {
            console.error(err);
        });
    }

    private async getShopConfig(): Promise<void> {
        const shopConfig = await this.dataService.getFirstObject('shop_config');
        if (!shopConfig) {
            return;
        }
        const language = shopConfig.language ? shopConfig.language : 'vn';
        const currency = shopConfig.currency ? shopConfig.currency : 'VND';
        const dateFormat = shopConfig.dateFormat ? shopConfig.dateFormat : 'DD/MM/YYYY';
        const timeFormat = shopConfig.timeFormat ? shopConfig.timeFormat : 'HH:mm';
        const outStock = shopConfig.outStockNotSell ? shopConfig.outStockNotSell : false;
        const printOrderLikeInvoice = shopConfig.printOrderLikeInvoice ? shopConfig.printOrderLikeInvoice : false;
        const hideTax = shopConfig.hideTax ? shopConfig.hideTax : false;
        this.hideTablesFunction = shopConfig.hideTablesFunction ? shopConfig.hideTablesFunction : false;
        this.hideCalendarFunction = shopConfig.hideCalendarFunction ? shopConfig.hideCalendarFunction : false;
        this.hideMaterials = shopConfig.hideMaterials ? shopConfig.hideMaterials : false;
        const currencySymbolToTheRight = shopConfig.currencySymbolToTheRight ? shopConfig.currencySymbolToTheRight : false;
        const orderInvoiceMaxEmptyRows = shopConfig.orderInvoiceMaxEmptyRows ? shopConfig.orderInvoiceMaxEmptyRows : 10;
        const hideDiscountColumn = shopConfig.hideDiscountColumn ? shopConfig.hideDiscountColumn : true;
        const showStaffNameUnderSign = shopConfig.showStaffNameUnderSign ? shopConfig.showStaffNameUnderSign : true;
        await this.userService.setCurrentCurrency(currency);
        await this.userService.setCurrentLanguage(language);
        await this.userService.setDateFormat(dateFormat);
        await this.userService.setTimeFormat(timeFormat);
        await this.userService.setOutstock(outStock);
        await this.userService.setPrintOrderLikeInvoice(printOrderLikeInvoice);
        await this.userService.setHideTax(hideTax);
        await this.userService.setHideTablesFunction(this.hideTablesFunction);
        await this.userService.setHideCalendarFunction(this.hideCalendarFunction);
        await this.userService.setHideMaterials(this.hideMaterials);
        await this.userService.setCurrencySymbolToTheRight(currencySymbolToTheRight);
        await this.userService.setOrderInvoiceMaxEmptyRows(orderInvoiceMaxEmptyRows);
        await this.userService.setHideDiscountColumn(hideDiscountColumn);
        await this.userService.setShowStaffNameUnderSign(showStaffNameUnderSign);
    }


    async loginAsOwner(): Promise<void> {
        this.staffService.hasChooseStaff = true;
        this.staffService.selectedStaff = null;
        this.hasSelectedStaff = true;
        this.selectedStaff = null;
        this.userService.setLoggedUser(this.userService.loggedUser);
        await this.getShopConfig();
        await this.checkCurrentPlan();
        this.firebase.getToken().then(async (token) => {
            await this.fcmTokenService.saveToken(token);
        }, (err) => {
            console.error(err);
        });
    }

    async openWeb() {
        this.analyticsService.logEvent('open-web-on-home');
        this.navCtrl.openExternalUrl('https://isale.online/app');
    }

    openAppIos() {
        this.analyticsService.logEvent('open-app-on-home-ios');
        this.navCtrl.openExternalUrl('https://apps.apple.com/us/app/isale-management/id1485080690');
    }

    manageTables() {
        this.navCtrl.push('/table');
    }

    calendars() {
        this.navCtrl.push('/calendar');
    }

    callPhone(mobile: string): void {
        if (!mobile) {
            return;
        }
        this.analyticsService.logEvent('home-call-hotline');
        Helper.callPhone(mobile);
    }

    sendEmail(mobile: string): void {
        if (!mobile) {
            return;
        }
        this.analyticsService.logEvent('home-mail');
        Helper.sendEmail(mobile);
    }

    requestProPlan() {
        this.navCtrl.push('/request-pro');
    }

    addMultiShop() {
        if (!this.currentPlan && !this.isOnTrial) {
            this.analyticsService.logEvent('check-store-alert');
            alert(this.translate.instant('store.check-store-alert'));
            return;
        }
        this.navCtrl.push('/store');
    }

    checkNotifications() {
        if (typeof FirebasePlugin === 'undefined') {
            return;
        }
        if (!this.platform.is('ios') && !this.platform.is('iphone')) {
            return;
        }
        FirebasePlugin.hasPermission((hasPermission) => {
            if (!hasPermission) {
                FirebasePlugin.grantPermission((hasPermission2) => {
                });
            }
        });
    }

    async viewFbPages() {
        await this.navCtrl.push('/fbpage');
    }

    showNotifies() {
        this.navCtrl.push('/fbpage/notifications');
    }
}
