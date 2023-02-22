import { User } from './../../models/user.model';
import { IUser } from './../../models/user.interface';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { NoteService } from '../../providers/note.service';
import { DataService } from '../../providers/data.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { PlanService } from '../../providers/plan.service';
import { FcmTokenService } from '../../providers/fcmtoken.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'config',
    templateUrl: './config.component.html',
})
export class ConfigComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    @ViewChild('fileUploadInput1', { static: false }) fileUploadInput1: ElementRef;
    @ViewChild('fileUploadInput2', { static: false }) fileUploadInput2: ElementRef;
    @ViewChild('fileUploadInput3', { static: false }) fileUploadInput3: ElementRef;
    shop: any = { id: 0, name: '' };
    shopConfig: any = {};
    saveDisabled = false;
    username = '';
    oldPassword = '';
    isRemember = false;
    newPassword = '';
    newConfirm = '';
    isEnableLogin = false;
    language: string;
    segment = 'shop';
    currenciesList: any[] = [];
    currency = 'VND';
    dateFormat = 'DD/MM/YYYY';
    timeFormat = 'HH:mm';
    outStock = false;
    currencySymbolToTheRight = false;
    orderInvoiceMaxEmptyRows = 10;
    hideDiscountColumn = true;
    showStaffNameUnderSign = false;
    hideProductCodePrint = true;
    printOrderLikeInvoice = false;
    hideTax = false;
    hideTablesFunction = false;
    hideCalendarFunction = false;
    hideMaterials = false;
    oldLanguage: string;
    oldCurrency = 'VND';
    oldDateFormat = 'DD/MM/YYYY';
    oldTimeFormat = 'HH:mm';
    oldOutStock = false;
    oldPrintOrderLikeInvoice = false;
    oldHideTax = false;
    oldHideTablesFunction = false;
    oldHideCalendarFunction = false;
    oldHideMaterials = false;
    oldCurrencySymbolToTheRight = false;
    oldOrderInvoiceMaxEmptyRows = 10;
    oldHideDiscountColumn = true;
    oldShowStaffNameUnderSign = false;
    oldHideProductCodePrint = true;
    fileToUpload: any;
    web: any = { isEnableWeb: true };
    fileToUpload1: any;
    fileToUpload2: any;
    fileToUpload3: any;
    noSave: any = true;
    countShop: string;
    currentPlan;
    isOnTrial;

    constructor(public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        public userService: UserService,
        private noteService: NoteService,
        private dataService: DataService,
        private camera: Camera,
        private storeService: StoreService,
        private actionSheetController: ActionSheetController,
        private alertCtrl: AlertController,
        private planService: PlanService,
        private staffService: StaffService,
        private fcmTokenService: FcmTokenService,
        private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('config');
    }

    changeSegment() {
        if (this.segment === 'language') {
            setTimeout(() => {
                this.noSave = false;
            }, 2000);
            return;
        }
        this.noSave = true;
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currenciesList = Helper.currenciesList();
        this.currentPlan = await this.planService.getCurrentPlan();
        const shopCreatedAt = this.shop ? new Date(this.shop.createdAt) : null;
        let shopCreatedAtPlus6 = null;
        if (shopCreatedAt) {
            shopCreatedAtPlus6 = new Date(this.shop.createdAt);
            shopCreatedAtPlus6.setDate(shopCreatedAtPlus6.getDate() + 6);
        }
        const currentDateMinus6 = new Date();
        currentDateMinus6.setDate(currentDateMinus6.getDate() - 6);
        this.isOnTrial = !this.currentPlan && shopCreatedAt && (shopCreatedAt >= currentDateMinus6);
        this.dataService.getFirstObject('shop_config').then(async (shopConfig) => {
            if (!shopConfig) {
                this.language = await this.userService.getCurrentLanguage();
                this.currency = await this.userService.getCurrentCurrency();
                this.dateFormat = await this.userService.getDateFormat();
                this.timeFormat = await this.userService.getTimeFormat();
                this.outStock = await this.userService.getOutstock();
                this.printOrderLikeInvoice = await this.userService.getPrintOrderLikeInvoice();
                this.hideTax = await this.userService.getHideTax();
                this.hideTablesFunction = await this.userService.getHideTablesFunction();
                this.hideCalendarFunction = await this.userService.getHideCalendarFunction();
                this.orderInvoiceMaxEmptyRows = await this.userService.getOrderInvoiceMaxEmptyRows();
                this.hideDiscountColumn = await this.userService.getHideDiscountColumn();
                this.showStaffNameUnderSign = await this.userService.getShowStaffNameUnderSign();
                this.hideProductCodePrint = await this.userService.getHideProductCodePrint();
                this.hideMaterials = await this.userService.getHideMaterials();
                this.currencySymbolToTheRight = await this.userService.getCurrencySymbolToTheRight();
                this.oldLanguage = this.language;
                this.oldCurrency = this.currency;
                this.oldDateFormat = this.dateFormat;
                this.oldTimeFormat = this.timeFormat;
                this.oldOutStock = this.outStock;
                this.oldPrintOrderLikeInvoice = this.printOrderLikeInvoice;
                this.oldHideTax = this.hideTax;
                this.oldHideTablesFunction = this.hideTablesFunction;
                this.oldHideCalendarFunction = this.hideCalendarFunction;
                this.oldOrderInvoiceMaxEmptyRows = this.orderInvoiceMaxEmptyRows;
                this.oldHideDiscountColumn = this.hideDiscountColumn;
                this.oldShowStaffNameUnderSign = this.showStaffNameUnderSign;
                this.oldHideProductCodePrint = this.hideProductCodePrint;
                this.oldHideMaterials = this.hideMaterials;
                this.oldCurrencySymbolToTheRight = this.currencySymbolToTheRight;
                return;
            }
            this.shopConfig = shopConfig;
            this.language = this.shopConfig.language ? this.shopConfig.language : 'vn';
            this.oldLanguage = this.language;
            this.currency = this.shopConfig.currency ? this.shopConfig.currency : 'VND';
            this.dateFormat = this.shopConfig.dateFormat ? this.shopConfig.dateFormat : 'DD/MM/YYYY';
            this.timeFormat = this.shopConfig.timeFormat ? this.shopConfig.timeFormat : 'HH:mm';
            this.outStock = this.shopConfig.outStockNotSell ? this.shopConfig.outStockNotSell : false;
            this.printOrderLikeInvoice = this.shopConfig.printOrderLikeInvoice ? this.shopConfig.printOrderLikeInvoice : false;
            this.hideTax = this.shopConfig.hideTax ? this.shopConfig.hideTax : false;
            this.hideTablesFunction = this.shopConfig.hideTablesFunction ? this.shopConfig.hideTablesFunction : false;
            this.hideCalendarFunction = this.shopConfig.hideCalendarFunction ? this.shopConfig.hideCalendarFunction : false;
            this.currencySymbolToTheRight = this.shopConfig.currencySymbolToTheRight ? this.shopConfig.currencySymbolToTheRight : false;
            this.orderInvoiceMaxEmptyRows = this.shopConfig.orderInvoiceMaxEmptyRows ? this.shopConfig.orderInvoiceMaxEmptyRows : 10;
            this.hideDiscountColumn = this.shopConfig.hideDiscountColumn ? true : false;
            this.showStaffNameUnderSign = this.shopConfig.showStaffNameUnderSign ? true : false;
            this.hideProductCodePrint = this.shopConfig.hideProductCodePrint ? true : false;
            this.hideMaterials = this.shopConfig.hideMaterials ? true : false;
            this.oldLanguage = this.language;
            this.oldCurrency = this.currency;
            this.oldDateFormat = this.dateFormat;
            this.oldTimeFormat = this.timeFormat;
            this.oldOutStock = this.outStock;
            this.oldPrintOrderLikeInvoice = this.printOrderLikeInvoice;
            this.oldHideTax = this.hideTax;
            this.oldHideTablesFunction = this.hideTablesFunction;
            this.oldHideCalendarFunction = this.hideCalendarFunction;
            this.oldCurrencySymbolToTheRight = this.currencySymbolToTheRight;
            this.oldOrderInvoiceMaxEmptyRows = this.orderInvoiceMaxEmptyRows;
            this.oldHideDiscountColumn = this.hideDiscountColumn;
            this.oldShowStaffNameUnderSign = this.showStaffNameUnderSign;
            this.oldHideProductCodePrint = this.hideProductCodePrint;
            this.oldHideMaterials = this.hideMaterials;
        });
        this.segment = 'shop';
        await this.reload();
    }

    async reload(): Promise<void> {
        this.userService.isEnableLogin().then((isEnable: boolean) => {
            this.isEnableLogin = isEnable;
            if (isEnable) {
                this.username = this.userService.loggedUser.username;
            }
        });
        const shop = await this.dataService.getFirstObject('shop');
        if (shop) {
            this.shop = shop;
        }
        const countShops = await this.storeService.countStores();
        this.countShop = countShops ? this.translateService.instant('store.count-shop', { count: countShops }) : null;
        const web = await this.dataService.getFirstObject('web');
        this.web = web ? web : this.web;
        if (this.shop && this.shop.name) {
            this.shop.webName = this.getMyWebUrl(this.shop);
        }
    }

    async saveWeb() {
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.dataService.save('web', this.web).then(async () => {
            this.analyticsService.logEvent('shop-save-web-successfully');
            this.saveDisabled = false;
            alert(this.translateService.instant('shop-add.save-web-done'));
            await loading.dismiss();
        }).catch(async () => {
            this.saveDisabled = false;
            await loading.dismiss();
        });
    }

    async saveShop(): Promise<void> {
        if (this.segment === 'web') {
            await this.saveWeb();
            return;
        }

        if (!this.shop || !this.shop.name) {
            alert(this.translateService.instant('shop-add.no-name-alert'));
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.dataService.save('shop', this.shop).then(async () => {
            this.analyticsService.logEvent('shop-save-successfully');
            this.saveDisabled = false;
            this.navCtrl.publish('reloadHome');
            alert(this.translateService.instant('shop-add.save-done'));
            await loading.dismiss();
            this.navCtrl.pop();
        }).catch(async () => {
            this.saveDisabled = false;
            await loading.dismiss();
        });
    }

    get hasDifferences(): boolean {
        if (
            this.oldLanguage != this.language
            || this.oldCurrency != this.currency
            || this.oldDateFormat != this.dateFormat
            || this.oldOutStock != this.outStock
            || this.oldPrintOrderLikeInvoice != this.printOrderLikeInvoice
            || this.oldTimeFormat != this.timeFormat
            || this.oldHideTax != this.hideTax
            || this.oldHideTablesFunction != this.hideTablesFunction
            || this.oldHideCalendarFunction != this.hideCalendarFunction
            || this.oldCurrencySymbolToTheRight != this.currencySymbolToTheRight
            || this.oldOrderInvoiceMaxEmptyRows != this.orderInvoiceMaxEmptyRows
            || this.oldHideDiscountColumn != this.hideDiscountColumn
            || this.oldShowStaffNameUnderSign != this.showStaffNameUnderSign
            || this.oldHideProductCodePrint != this.hideProductCodePrint
            || this.oldHideMaterials != this.hideMaterials
        ) {
            return true;
        }
        return false;
    }

    checkSaveAndHome() {
        if (this.hasDifferences) {
            if (!confirm(this.translateService.instant('shop-add.config-not-save-alert'))) {
                return;
            }
        }
        this.navCtrl.home();
    }

    async saveShopConfig(): Promise<void> {
        if (this.noSave) {
            return;
        }
        if (this.oldLanguage !== this.language) {
            this.changeLanguage();
            this.oldLanguage = this.language;
        }
        if (this.oldCurrency !== this.currency) {
            this.changeCurrency();
            this.oldCurrency = this.currency;
        }
        if (this.oldDateFormat !== this.dateFormat) {
            this.changeDateFormat();
            this.oldDateFormat = this.dateFormat;
        }
        if (this.oldTimeFormat !== this.timeFormat) {
            this.changeTimeFormat();
            this.oldTimeFormat = this.timeFormat;
        }
        if (this.oldOutStock !== this.outStock) {
            this.changeOutstock();
            this.oldOutStock = this.outStock;
        }
        if (this.oldPrintOrderLikeInvoice !== this.printOrderLikeInvoice) {
            this.changePrintOrderLikeInvoice();
            this.oldPrintOrderLikeInvoice = this.printOrderLikeInvoice;
        }
        if (this.oldHideTax !== this.hideTax) {
            this.changeHideTax();
            this.oldHideTax = this.hideTax;
        }

        if (this.oldHideTablesFunction !== this.hideTablesFunction) {
            this.changeHideTablesFunction();
            this.oldHideTablesFunction = this.hideTablesFunction;
        }

        if (this.oldHideCalendarFunction !== this.hideCalendarFunction) {
            this.changeHideCalendarFunction();
            this.oldHideCalendarFunction = this.hideCalendarFunction;
        }
        if (this.oldCurrencySymbolToTheRight !== this.currencySymbolToTheRight) {
            this.changeCurrencySymbolToTheRight();
            this.oldCurrencySymbolToTheRight = this.currencySymbolToTheRight;
        }
        if (this.oldOrderInvoiceMaxEmptyRows !== this.orderInvoiceMaxEmptyRows) {
            this.changeOrderInvoiceMaxEmptyRows();
            this.oldOrderInvoiceMaxEmptyRows = this.orderInvoiceMaxEmptyRows;
        }
        if (this.oldHideDiscountColumn !== this.hideDiscountColumn) {
            this.changeHideDiscountColumn();
            this.oldHideDiscountColumn = this.hideDiscountColumn;
        }

        if (this.oldShowStaffNameUnderSign !== this.showStaffNameUnderSign) {
            this.changeShowStaffNameUnderSign();
            this.oldShowStaffNameUnderSign = this.showStaffNameUnderSign;
        }

        if (this.oldHideProductCodePrint !== this.hideProductCodePrint) {
            this.changeHideProductCodePrint();
            this.oldHideProductCodePrint = this.hideProductCodePrint;
        }

        if (this.oldHideMaterials !== this.hideMaterials) {
            this.changeHideMaterials();
            this.oldHideMaterials = this.hideMaterials;
        }

        const shopConfig: any = {
            currency: this.currency,
            language: this.language,
            dateFormat: this.dateFormat,
            timeFormat: this.timeFormat,
            outStockNotSell: this.outStock,
            currencySymbolToTheRight: this.currencySymbolToTheRight,
            orderInvoiceMaxEmptyRows: this.orderInvoiceMaxEmptyRows,
            hideDiscountColumn: this.hideDiscountColumn,
            showStaffNameUnderSign: this.showStaffNameUnderSign,
            hideProductCodePrint: this.hideProductCodePrint,
            hideMaterials: this.hideMaterials,
            printOrderLikeInvoice: this.printOrderLikeInvoice,
            hideCalendarFunction: this.hideCalendarFunction,
            hideTablesFunction: this.hideTablesFunction,
            hideTax: this.hideTax
        };
        if (this.shopConfig) {
            const id = this.shopConfig.id;
            shopConfig.id = id;
        }
        this.shopConfig = shopConfig;
        const loading = await this.navCtrl.loading();
        this.dataService.save('shop_config', this.shopConfig).then(async () => {
            this.analyticsService.logEvent('shop-config-save-successfully');
            await loading.dismiss();
            alert(this.translateService.instant('shop-add.save-done'));
        });
    }

    async changeInfo(): Promise<void> {
        if (!this.username || this.username === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('config.alert-username-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.oldPassword || this.oldPassword === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('config.alert-old-password-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.newPassword || this.newPassword === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('config.alert-new-password-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.newConfirm || this.newConfirm === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('config.alert-confirm-password-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (this.newConfirm !== this.newPassword) {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('config.alert-confirm-not-match'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        this.userService.getUserByNameAndPassword(this.userService.loggedUser.username, this.oldPassword, this.isRemember)
            .then(async (userGet: IUser) => {
                if (userGet && userGet != null) {
                    const newUser = new User();
                    newUser.id = this.userService.loggedUser.id;
                    newUser.username = this.username;
                    newUser.password = this.newPassword;
                    this.userService.saveUser(newUser, this.oldPassword).then(async () => {
                        const alert = await this.alertCtrl.create({
                            header: this.translateService.instant('common.alert'),
                            subHeader: this.translateService.instant('config.alert-change-sucess'),
                            buttons: ['OK']
                        });
                        await alert.present();
                        this.newPassword = '';
                        this.newConfirm = '';
                        this.oldPassword = '';
                    });
                } else {
                    const alert = await this.alertCtrl.create({
                        header: this.translateService.instant('common.alert'),
                        subHeader: this.translateService.instant('config.alert-old-password-not-right'),
                        buttons: ['OK']
                    });
                    await alert.present();
                }
            });
    }

    disableOrEnableLogin(): void {
        if (this.isEnableLogin) {
            this.userService.disableLogin().then(() => {
                this.userService.setLoggedUser(null);
                this.navCtrl.navigateRoot('/contact');
            });
            return;
        }
        this.userService.enableLogin().then(() => {
            this.userService.setLoggedUser(null);
        });
    }

    deleteUser(): void {
        this.userService.deleteUser().then(() => {
            this.disableOrEnableLogin();
        });
    }

    changeLanguage(): void {
        this.userService.setCurrentLanguage(this.language);
    }

    changeCurrency(): void {
        this.userService.setCurrentCurrency(this.currency);
    }

    changeDateFormat(): void {
        this.userService.setDateFormat(this.dateFormat);
        this.navCtrl.publish('reset-dateformat', this.dateFormat);
    }

    changeTimeFormat(): void {
        this.userService.setTimeFormat(this.timeFormat);
        this.navCtrl.publish('reset-timeformat', this.timeFormat);
    }

    changeOutstock(): void {
        this.userService.setOutstock(this.outStock);
        this.navCtrl.publish('reset-outstock', this.outStock);
    }

    changePrintOrderLikeInvoice() {
        this.userService.setPrintOrderLikeInvoice(this.printOrderLikeInvoice);
        this.navCtrl.publish('reset-print-order-like-invoice', this.printOrderLikeInvoice);
    }

    changeHideTablesFunction() {
        this.userService.setHideTablesFunction(this.hideTablesFunction);
        this.navCtrl.publish('reset-hide-tables-function', this.hideTablesFunction);
        this.navCtrl.publish('reloadHomeConfig');
    }

    changeHideCalendarFunction() {
        this.userService.setHideCalendarFunction(this.hideCalendarFunction);
        this.navCtrl.publish('reset-hide-calendar-function', this.hideCalendarFunction);
        this.navCtrl.publish('reloadHomeConfig');
    }

    changeHideTax() {
        this.userService.setHideTax(this.hideTax);
        this.navCtrl.publish('reset-hide-tax', this.hideTax);
    }

    changeOrderInvoiceMaxEmptyRows() {
        this.userService.setOrderInvoiceMaxEmptyRows(this.orderInvoiceMaxEmptyRows);
        this.navCtrl.publish('reset-order-invoice-max-empty-rows', this.orderInvoiceMaxEmptyRows);
    }

    changeHideDiscountColumn() {
        this.userService.setHideDiscountColumn(this.hideDiscountColumn);
        this.navCtrl.publish('reset-hide-discount-column', this.hideDiscountColumn);
    }

    changeShowStaffNameUnderSign() {
        this.userService.setShowStaffNameUnderSign(this.showStaffNameUnderSign);
        this.navCtrl.publish('reset-show-staff-name-under-sign', this.showStaffNameUnderSign);
    }

    changeHideProductCodePrint() {
        this.userService.setHideProductCodePrint(this.hideProductCodePrint);
        this.navCtrl.publish('reset-hide-product-code-print', this.hideProductCodePrint);
    }

    changeHideMaterials() {
        this.userService.setHideMaterials(this.hideMaterials);
        this.navCtrl.publish('reset-hide-materials', this.hideMaterials);
        this.navCtrl.publish('reloadHomeConfig');
    }

    changeCurrencySymbolToTheRight() {
        this.userService.setCurrencySymbolToTheRight(this.currencySymbolToTheRight);
        this.navCtrl.publish('reset-currency-symbol-to-the-right', this.currencySymbolToTheRight);
    }

    async switchToOffline(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('sync.switch-to-offline-confirm'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        const arr = [
                            , this.userService.disableLogin()
                        ];
                        await Promise.all(arr);
                        await this.userService.setLoggedUser(null);
                        const alert = await this.alertCtrl.create({
                            header: this.translateService.instant('common.alert'),
                            subHeader: this.translateService.instant('sync.switch-note'),
                            buttons: ['OK']
                        });
                        await alert.present();
                        this.navCtrl.publish('reloadHome');
                    }
                },
            ]
        });
        await confirm.present();
    }

    rememberFile($event, callback): void {
        this.fileToUpload = $event.target.files[0];
        this.browsePicture(callback);
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.shop.iconUrl);
    }

    browsePicture(callback): void {
        if (!this.fileToUpload) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.noteService.uploadPicture(this.fileToUpload).then((message) => {
            if (message && message.url) {
                callback(message.url);
            } else if (message && message.error) {
                alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            }
        }).catch(() => {
            alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
        });
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    uploadCallBack = (url) => {
        this.shop.iconUrl = url;
        this.fileToUpload = null;
        this.fileUploadInput.nativeElement.value = null;
    }

    uploadBanner1CallBack = (url) => {
        this.web.bannerUrl1 = url;
        this.fileToUpload1 = null;
        this.fileUploadInput1.nativeElement.value = null;
    }

    uploadBanner2CallBack = (url) => {
        this.web.bannerUrl2 = url;
        this.fileToUpload2 = null;
        this.fileUploadInput2.nativeElement.value = null;
    }

    uploadBanner3CallBack = (url) => {
        this.web.bannerUrl3 = url;
        this.fileToUpload3 = null;
        this.fileUploadInput3.nativeElement.value = null;
    }

    async upload(callback) {
        const actionSheet = await this.actionSheetController.create({
            header: this.translateService.instant('common.select-image-source'),
            buttons: [{
                text: this.translateService.instant('common.load-from-gallery'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.PHOTOLIBRARY,
                        (url) => { callback(url); });
                }
            },
            {
                text: this.translateService.instant('common.use-camera'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.CAMERA,
                        (url) => { callback(url); });
                }
            },
            {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel'
            }
            ]
        });
        await actionSheet.present();
    }

    async doUpload(sourceType: number, callBack) {
        const options: CameraOptions = {
            quality: 100,
            sourceType,
            destinationType: this.camera.DestinationType.DATA_URL,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE
        };
        this.camera.getPicture(options).then(async (imageData) => {
            const base64Image = imageData;
            const loading = await this.navCtrl.loading();
            this.noteService.uploadPictureBase64(base64Image).then(async (message) => {
                await loading.dismiss();
                if (message && message.url) {
                    callBack(message.url);
                } else if (message && message.error) {
                    alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
                }
            }).catch(async (err) => {
                await loading.dismiss();
                console.error(err);
            });
        });
    }

    getMyWebUrl(shop) {
        const shopCloned = JSON.parse(JSON.stringify(shop));
        let name = '';
        try {
            name = shopCloned.name;
            name = this.removeVietnameseTones(name);
            name = name.toLowerCase();
            name = name.replace(/[^a-z0-9 -]/gi, '');
            name = name.replace(/ +(?= )/g, '');
            name = name.split(' ').join('-');
        } catch (error) {
            name = 'abc';
        }
        if (!name) {
            name = 'abc';
        }

        return 'https://isale.online/' + shopCloned.id + '/' + name;
    }

    openMyWeb() {
        this.analyticsService.logEvent('config-open-my-web');
        const myWebUrl = this.getMyWebUrl(this.shop);
        this.navCtrl.openExternalUrl(myWebUrl);
    }

    openExampleWeb() {
        this.analyticsService.logEvent('config-open-example-web');
        this.navCtrl.openExternalUrl('https://isale.online/268/shop-isale');
    }

    removeVietnameseTones(str) {
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
        str = str.replace(/đ/g, 'd');
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
        str = str.replace(/Đ/g, 'D');
        // Some system encode vietnamese combining accent as individual utf-8 characters
        // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
        str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
        // Remove extra spaces
        // Bỏ các khoảng trắng liền nhau
        str = str.replace(/ + /g, ' ');
        str = str.trim();
        // Remove punctuations
        // Bỏ dấu câu, kí tự đặc biệt
        str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
        return str;
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    removeShopPhoto() {
        this.shop.iconUrl = null;
    }

    removeBanner1() {
        this.web.bannerUrl1 = null;
    }

    removeBanner2() {
        this.web.bannerUrl2 = null;
    }

    removeBanner3() {
        this.web.bannerUrl3 = null;
    }

    async deleteAccount() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('shop-add.delete-shop-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        const loading = await this.navCtrl.loading();
                        this.dataService.delete('shop_config', this.shopConfig).then(async () => {
                            await this.logout();
                            await loading.dismiss();
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }



    async logout(): Promise<void> {
        await this.userService.removeRefreshToken().then(async () => {
            this.analyticsService.logEvent('logout-successfully');
            await this.storeService.exitStore();
            await this.fcmTokenService.removeLoggedTokens();
            this.userService.setLoggedUser(null, false);
            this.staffService.hasChooseStaff = false;
            this.staffService.selectedStaff = null;
            this.staffService.staffsToSelect = null;
            const arr = [];
            arr.push(this.userService.removeCurrentCurrency());
            arr.push(this.userService.removeCurrentLanguage());
            arr.push(this.userService.removeDateFormat());
            arr.push(this.userService.removeLastBackup());
            arr.push(this.userService.removeLastLogin());
            arr.push(this.userService.removeOutstock());
            arr.push(this.userService.removeTimeFormat());
            await Promise.all(arr);
            await this.userService.removeRefreshToken();
            this.navCtrl.navigateRoot('/login');
        });
    }
}
