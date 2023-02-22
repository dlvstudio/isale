import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { UserService } from '../../providers/user.service';
import { DataService } from '../../providers/data.service';
import { IUser } from '../../models/user.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { FcmTokenService } from '../../providers/fcmtoken.service';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';
import { ActivityService } from '../../providers/activity.service';

@Component({
    selector: 'login',
    templateUrl: 'login.page.html',
})
export class LoginComponent {
    username = '';
    password = '';
    hasNoOfflineUser = false;
    language = 'vn';
    isRemember = false;

    constructor(public navCtrl: RouteHelperService,
        public userService: UserService,
        private translateService: TranslateService,
        private activityService: ActivityService,
        private dataService: DataService,
        private storeService: StoreService,
        private staffService: StaffService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private firebase: FirebaseX,
        private fcmTokenService: FcmTokenService,
    ) {
        this.navCtrl.removeEventListener('reloadLogin', this.reload);
        this.navCtrl.addEventListener('reloadLogin', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('login');
        this.language = await this.userService.getCurrentLanguage();
    }

    reload = () => {
        this.userService.getLastLogin().then((user) => {
            if (!user) {
                return;
            }
            this.username = user.userName;
        });
        this.activityService.logActivity({feature: 'Login', action: '', note: ''});
        if (this.userService.loggedUser != null) {
            this.navCtrl.navigateRoot('/home');
        }
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    async login(): Promise<void> {
        if (!this.username || this.username.trim() === '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('register.alert-username-required'),
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

        await this.tryLogin(this.username, this.password, this.isRemember);
    }

    logout(): void {
        this.userService.removeRefreshToken().then(async () => {
            this.analyticsService.logEvent('logout-successfully');
            await this.storeService.exitStore();
            await this.fcmTokenService.removeLoggedTokens();
            this.userService.setLoggedUser(null, false);
            this.staffService.hasChooseStaff = false;
            this.staffService.selectedStaff = null;
            this.staffService.staffsToSelect = null;
            const arr = [];
            arr.push(this.userService.removeCurrentLanguage());
            arr.push(this.userService.removeCurrentCurrency());
            arr.push(this.userService.removeDateFormat());
            arr.push(this.userService.removeLastBackup());
            arr.push(this.userService.removeLastLogin());
            arr.push(this.userService.removeTimeFormat());
            arr.push(this.userService.removeOutstock());
            await Promise.all(arr);
            await this.userService.removeRefreshToken();
            this.navCtrl.navigateRoot('/login');
        });
    }

    private async getShopConfig(): Promise<any> {
        const shopConfig = await this.dataService.getFirstObject('shop_config');
        if (!shopConfig) {
            this.logout();
            return shopConfig;
        }
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
        const currencySymbolToTheRight = shopConfig.currencySymbolToTheRight ? shopConfig.currencySymbolToTheRight : false;
        const orderInvoiceMaxEmptyRows = shopConfig.orderInvoiceMaxEmptyRows ? shopConfig.orderInvoiceMaxEmptyRows : 10;
        const hideDiscountColumn = shopConfig.hideDiscountColumn ? true : false;
        const showStaffNameUnderSign = shopConfig.showStaffNameUnderSign ? true : false;
        this.userService.setCurrentCurrency(currency);
        this.userService.setCurrentLanguage(language);
        this.userService.setDateFormat(dateFormat);
        this.userService.setTimeFormat(timeFormat);
        this.userService.setOutstock(outStock);
        this.userService.setPrintOrderLikeInvoice(printOrderLikeInvoice);
        this.userService.setHideTax(hideTax);
        this.userService.setHideTablesFunction(hideTablesFunction);
        this.userService.setHideCalendarFunction(hideCalendarFunction);
        this.userService.setHideMaterials(hideMaterials);
        this.userService.setCurrencySymbolToTheRight(currencySymbolToTheRight);
        this.userService.setOrderInvoiceMaxEmptyRows(orderInvoiceMaxEmptyRows);
        this.userService.setHideDiscountColumn(hideDiscountColumn);
        this.userService.setShowStaffNameUnderSign(showStaffNameUnderSign);
        return shopConfig;
    }

    private async tryLogin(username: string, password: string, isRemember: boolean): Promise<void> {
        const loading = await this.navCtrl.loading();
        await this.userService.getUserByNameAndPassword(username.trim(), password, isRemember)
            .then(async (ret: any) => {
                if (ret) {
                    this.analyticsService.logEvent('login-successfully');
                    const user = ret as IUser;
                    user.isRemember = isRemember;
                    if (!this.navCtrl.isNotCordova()) {
                        this.firebase.getToken().then(async (token) => {
                            await this.fcmTokenService.saveToken(token);
                        }, (err) => {
                            console.error(err);
                        });
                    }
                    const shopConfig = await this.getShopConfig();
                    if (shopConfig) {
                        this.userService.setLoggedUser(user);
                        await this.navCtrl.navigateRoot('/home');
                    } else {
                        const alert = await this.alertCtrl.create({
                            header: this.translateService.instant('common.alert'),
                            subHeader: this.translateService.instant('login.alert-username-orpassword-notcorrect'),
                            buttons: ['OK']
                        });
                        await alert.present();
                    }
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

    register(): void {
        this.navCtrl.navigateForward('/register');
    }

    disableLogin(): void {
        this.userService.disableLogin().then(() => {
            this.userService.setLoggedUser(null);
            this.navCtrl.navigateForward('/contacts');
        });
    }

    changeLanguage(): void {
        this.analyticsService.logEvent('login-change-language');
        this.userService.setCurrentLanguage(this.language);
    }

    changeto(lang: string) {
        this.language = lang;
        this.changeLanguage();
    }

    async openWeb() {
        this.analyticsService.logEvent('open-web-on-login');
        this.navCtrl.openExternalUrl('https://isale.online/app');
    }

    async openAppAndroid() {
        this.analyticsService.logEvent('open-app-on-home');
        this.navCtrl.openExternalUrl('https://play.google.com/store/apps/details?id=com.dlv.isale');
    }

    openAppIos() {
        this.analyticsService.logEvent('open-app-on-home-ios');
        this.navCtrl.openExternalUrl('https://apps.apple.com/us/app/isale-management/id1485080690');
    }
}
