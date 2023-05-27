import { Component } from '@angular/core';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivityService } from '../../providers/activity.service';
import { IUser } from '../../models/user.interface';
import { AnalyticsService } from '../../providers/analytics.service';
import { DataService } from '../../providers/data.service';
import { FcmTokenService } from '../../providers/fcmtoken.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { UserService } from '../../providers/user.service';

@Component({
    selector: 'register',
    templateUrl: 'register.component.html',
})
export class RegisterComponent {
    username = '';
    password = '';
    confirm = '';
    language = 'vn';
    shop = '';

    constructor(public navCtrl: RouteHelperService,
                private translateService: TranslateService,
                public userService: UserService,
                private activityService: ActivityService,
                private alertCtrl: AlertController,
                private dataService: DataService,
                private analyticsService: AnalyticsService,
                private firebase: FirebaseX,
                private fcmTokenService: FcmTokenService,
    ) {
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit() {
        this.userService.getAttr('current-language').then((lang) => {
            this.language = lang;
        });
        this.activityService.logActivity({feature: 'Register', action: '', note: ''});
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('register');
    }

    async register(): Promise<void> {
        if (!this.shop || this.shop.trim() === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.alert-shop-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.username || this.username.trim() === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.alert-username-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.validate(this.username.trim())) {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.alert-email-phone-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.password || this.password === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.alert-password-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.confirm || this.confirm === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.alert-confirm-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (this.confirm !== this.password) {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.alert-confirm-notmatch'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }
        const loading = await this.navCtrl.loading();
        this.userService.register(this.username.trim().toLowerCase(), this.password, this.shop).then(async () => {
            this.analyticsService.logEvent('register-successfully');

            await loading.dismiss();
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.register-successfully') + ' ' + this.username.trim(),
                buttons: ['OK']
            });
            await alert.present();
            await this.tryLogin();
        });
    }

    private async tryLogin(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.userService.getUserByNameAndPassword(this.username.trim(), this.password, true)
            .then(async (ret: any) => {
                if (ret) {
                    this.analyticsService.logEvent('login-successfully');
                    const user = ret as IUser;
                    user.isRemember = true;
                    this.userService.setLoggedUser(user);
                    if (!this.navCtrl.isNotCordova()) {
                        this.firebase.getToken().then(async (token) => {
                            await this.fcmTokenService.saveToken(token);
                        }, (err) => {
                            console.error(err);
                        });
                    }
                    const shopModel = { id: 0, name: this.shop };
                    await this.dataService.save('shop', shopModel);
                    const shopConfig = {
                        id: 0,
                        language: this.language,
                        currency: this.language === 'en' ? 'USD' : 'VND',
                        dateFormat: this.language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
                        timeFormat: 'HH:mm',
                    };
                    await this.dataService.save('shop_config', shopConfig);
                    await this.getShopConfig();
                    this.navCtrl.navigateRoot('/home');
                } else {
                    const alert = await this.alertCtrl.create({
                        header: this.translateService.instant('common.alert'),
                        subHeader: this.translateService.instant('login.alert-username-orpassword-notcorrect'),
                        buttons: ['OK']
                    });
                    await alert.present();
                }
                await loading.dismiss();
            }, async (err) => {
                console.error(err);
                alert('Check your internet connection - Kiểm tra lại kết nối mạng');
                await loading.dismiss();
            }).catch(async (err) => {
                console.error(err);
                alert('Check your internet connection - Kiểm tra lại kết nối mạng');
                await loading.dismiss();
            });
    }

    private async getShopConfig(): Promise<void> {
        await this.dataService.getFirstObject('shop_config').then((shopConfig) => {
            const language = shopConfig && shopConfig.language ? shopConfig.language : 'vn';
            const currency = shopConfig && shopConfig.currency ? shopConfig.currency : 'VND';
            const dateFormat = shopConfig && shopConfig.dateFormat ? shopConfig.dateFormat : 'DD/MM/YYYY';
            const timeFormat = shopConfig && shopConfig.timeFormat ? shopConfig.timeFormat : 'HH:mm';
            const outStock = shopConfig && shopConfig.outStockNotSell ? shopConfig.outStockNotSell : false;
            const printOrderLikeInvoice = shopConfig && shopConfig.printOrderLikeInvoice ? shopConfig.printOrderLikeInvoice : false;
            const hideTax = shopConfig && shopConfig.hideTax ? shopConfig.hideTax : false;
            const hideTablesFunction = shopConfig && shopConfig.hideTablesFunction ? shopConfig.hideTablesFunction : false;
            const hideCalendarFunction = shopConfig && shopConfig.hideCalendarFunction ? shopConfig.hideCalendarFunction : false;
            const hideMaterials = shopConfig && shopConfig.hideMaterials ? shopConfig.hideMaterials : false;
            const orderInvoiceMaxEmptyRows = shopConfig.orderInvoiceMaxEmptyRows ? shopConfig.orderInvoiceMaxEmptyRows : 10;
            const hideDiscountColumn = shopConfig.hideDiscountColumn ? true : false;
            const showStaffNameUnderSign = shopConfig.showStaffNameUnderSign ? true : false;
            this.userService.setAttr('current-currency', currency);
            this.userService.setCurrentLanguage(language);
            this.userService.setAttr('date-format', dateFormat);
            this.userService.setAttr('time-format', timeFormat);
            this.userService.setAttr('out-stock', outStock);
            this.userService.setAttr('print-order-like-invoice', printOrderLikeInvoice);
            this.userService.setAttr('hide-tax', hideTax);
            this.userService.setAttr('hide-tables-function', hideTablesFunction);
            this.userService.setAttr('hide-calendar-function', hideCalendarFunction);
            this.userService.setAttr('hide-materials', hideMaterials);
            this.userService.setAttr('order-invoice-max-empty-rows', orderInvoiceMaxEmptyRows);
            this.userService.setAttr('hide-discount-column', hideDiscountColumn);
            this.userService.setAttr('show-staff-name-under-sign', showStaffNameUnderSign);
        });
    }

    validate(str: string): boolean {
        return this.validateEmail(str) || this.validatePhonenumber(str);
    }

    validateEmail(mail): boolean {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
            return true;
        }
        return false;
    }

    validatePhonenumber(str: string): boolean {
        const phoneno = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
        if (str.match(phoneno)) {
            return true;
        } else {
            return false;
        }
    }

    changeLanguage(): void {
        this.analyticsService.logEvent('register-change-language');
        this.userService.setCurrentLanguage(this.language);
    }

    changeto(lang: string) {
        this.language = lang;
        this.changeLanguage();
    }
}
