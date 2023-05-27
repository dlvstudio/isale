import { User } from './../../models/user.model';
import { IUser } from './../../models/user.interface';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { DataService } from '../../providers/data.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { FcmTokenService } from '../../providers/fcmtoken.service';
import { StaffService } from '../../providers/staff.service';
import { kebabToCamel, removeVietnameseTones } from '../../providers/helper';

@Component({
    selector: 'config',
    templateUrl: './config.component.html',
})
export class ConfigComponent {
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    @ViewChild('fileUploadInput1', { static: false }) fileUploadInput1: ElementRef;
    @ViewChild('fileUploadInput2', { static: false }) fileUploadInput2: ElementRef;
    @ViewChild('fileUploadInput3', { static: false }) fileUploadInput3: ElementRef;
    userConfig = {
        'hide-tables-function': [false, false],
        'hide-calendar-function': [false, false],
        'hide-tax': [false, false],
        'out-stock': [false, false, 'outStockNotSell'],
        'hide-materials': [false, false],
        'current-currency': ['VND', 'VND', 'currency'],
        'date-format': ['DD/MM/YYYY', 'DD/MM/YYYY'],
        'order-invoice-max-empty-rows': [10, 10],
        'hide-discount-column': [true, true],
        'show-staff-name-under-sign': [false, false],
        'hide-product-code-print': [true, true],
        'print-order-like-invoice': [false, false,],
        'order-print-note': ['', ''],
        'time-format': ['HH:mm', 'HH:mm'],
        'show-staff-phone': [false, false],
        'hide-promotion-function': [false, false],
    }
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
    oldLanguage: string;
    fileToUpload: any;
    web: any = { isEnableWeb: true };
    fileToUpload1: any;
    fileToUpload2: any;
    fileToUpload3: any;
    noSave: any = true;
    countShop: string;

    constructor(public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        public userService: UserService,
        private dataService: DataService,
        private camera: Camera,
        private storeService: StoreService,
        private actionSheetController: ActionSheetController,
        private alertCtrl: AlertController,
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
        this.dataService.getFirstObject('shop_config').then(async (shopConfig) => {
            if (!shopConfig) {
                this.language = await this.userService.getAttr('current-language');
                await this.getAttsFromService();
                this.oldLanguage = this.language;
                this.setOldConfigToNew();
                return;
            }
            this.shopConfig = shopConfig;
            this.language = this.shopConfig.language ? this.shopConfig.language : 'vn';
            this.oldLanguage = this.language;

            for (const prop of Object.keys(this.userConfig)) {
                this.userConfig[prop][0] = this.shopConfig[this.getProp(prop)] ?? this.userConfig[prop][1];
            }
            this.oldLanguage = this.language;
            this.setOldConfigToNew();
        });
        this.segment = 'shop';
        await this.reload();
    }

    getProp(prop) {
        return this.userConfig[prop].length === 3
            ? this.userConfig[prop][2]
            : kebabToCamel(prop);
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
            || this.userConfigHasDiff()
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
        this.checkChange();


        const shopConfig: any = {
            language: this.language,
        };
        for (const prop of Object.keys(this.userConfig)) {
            shopConfig[this.getProp(prop)] = this.userConfig[prop][0];
        }
        if (this.shopConfig) {
            const id = this.shopConfig.id;
            shopConfig.id = id;
        }
        this.shopConfig = shopConfig;
        const loading = await this.navCtrl.loading();
        this.navCtrl.dispatchEvent('reset-timeformat', this.shopConfig.timeFormat);
        this.navCtrl.dispatchEvent('reset-dateformat', this.shopConfig.dateFormat);
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
        this.dataService.uploadPicture(this.fileToUpload).then((message) => {
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
            this.dataService.uploadPictureBase64(base64Image).then(async (message) => {
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
            name = removeVietnameseTones(name);
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
            arr.push(this.remoteAttrs());
            arr.push(this.userService.removeAttr('current-language'));
            arr.push(this.userService.removeLastBackup());
            arr.push(this.userService.removeLastLogin());
            await Promise.all(arr);
            await this.userService.removeRefreshToken();
            this.navCtrl.navigateRoot('/login');
        });
    }

    changeAttr(name) {
        this.userService.setAttr(name, this.userConfig[name][0]);
        this.navCtrl.publish('reset-' + name, this.userConfig[name][0]);
        this.navCtrl.publish('reloadHomeConfig');
    }

    userConfigHasDiff(): boolean {
        for (const prop of Object.keys(this.userConfig)) {
            if (this.userConfig[prop][0] !== this.userConfig[prop][1]) {
                return true;
            }
        }
        return false;
    }

    setOldConfigToNew() {
        for (const prop of Object.keys(this.userConfig)) {
            this.userConfig[prop][1] = this.userConfig[prop][0];

        }
    }

    async getAttsFromService() {
        for (const prop of Object.keys(this.userConfig)) {
            this.userConfig[prop][0] = await this.userService.getAttr(prop);
        }
    }

    checkChange() {
        for (const prop of Object.keys(this.userConfig)) {
            if (this.userConfig[prop][1] !== this.userConfig[prop][0]) {
                this.changeAttr(prop);
                this.userConfig[prop][1] = this.userConfig[prop][0];
            }
        }
    }

    async remoteAttrs() {
        const arr = [];
        for (const prop of Object.keys(this.userConfig)) {
            if (this.userConfig[prop][1] !== this.userConfig[prop][0]) {
                arr.push(this.userService.removeAttr(prop));
            }
        }
        await Promise.all(arr);
    }
}
