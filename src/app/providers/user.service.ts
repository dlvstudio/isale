/* eslint-disable eqeqeq */
/* tslint:disable:triple-equals */
import { Helper } from './helper.service';
import { Injectable } from '@angular/core';

import { IUser } from './../models/user.interface';
import { User } from './../models/user.model';

import { StorageService } from './storage.service';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, ToastController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { ShareSelectComponent } from '../pages/share/share-select.component';
import { RouteHelperService } from './route-helper.service';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class UserService {

    private currentHideTablesFunction = false;
    private currentHideCalendarFunction = false;
    private currentOrderInvoiceMaxEmptyRows = 10;
    private currentHideDiscountColumn = true;
    private currentShowStaffNameUnderSign = false;
    private currentHideProductCodePrint = true;
    private currentHideMaterials = false;
    private currentCurrencySymbolToTheRight = false;
    private currentLanguage = 'vn';
    private currentCurrency = 'VND';
    private currentDateFormat = 'DD/MM/YYYY';
    private currentTimeFormat = 'HH:mm';
    private currentOutstock = false;
    private currentPrintOrderLikeInvoice = false;
    private currentHideTax = false;
    private defaultOrderFormCollapsed = false;
    public authenApiUrl = 'https://atakafe.com/api';
    // public authenApiUrl = "http://localhost:5000";
    public apiUrl = 'https://atakafe.com/isale-api';
    // public apiUrl = "https://atakafe.com/isale-api-test";
    // public apiUrl = 'http://localhost:5001';

    loggedUser: IUser;
    hasOfflineUser: boolean;
    isDisableLogin: boolean;
    token: string;

    constructor(
        private http: HttpClient,
        private socialSharing: SocialSharing,
        private storage: StorageService,
        private translateService: TranslateService,
        private modalCtrl: ModalController,
        private toastCtrl: ToastController,
        private navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
    ) {
    }

    async presentToast() {
        const toast = await this.toastCtrl.create({
            message: 'Đang tải... (Loading...)', // message,
            duration: 3000
        });
        await toast.present();
    }

    getCurrentLanguage(): Promise<string> {
        return this.getStringAttribute('current-language', this.currentLanguage);
    }

    async setCurrentLanguage(lang: string): Promise<void> {
        await this.storage.set('current-language', lang);
        this.translateService.use(lang);
        const currency = await this.storage.get('current-currency').catch(() => {
            this.setCurrentCurrency(lang === 'vn' ? 'VND' : 'USD');
            this.setDateFormat(lang === 'vn' ? 'DD/MM/YYYY' : 'MM/DD/YYYY');
        });
        if (!currency || currency === '') {
            await this.setCurrentCurrency(lang === 'vn' ? 'VND' : 'USD');
            await this.setDateFormat(lang === 'vn' ? 'DD/MM/YYYY' : 'MM/DD/YYYY');
        }
    }

    removeCurrentLanguage() {
        return this.storage.remove('current-language');
    }

    getLastBackup(): Promise<string> {
        return new Promise((res, j) => {
            this.storage.get('last-backup').then((dateTime) => {
                res(dateTime);
            }).catch(() => {
                res('');
            });
        });
    }

    checkFontSizeSmall(): Promise<boolean> {
        return new Promise((res, j) => {
            this.storage.get('font-size-small').then((fontSizeSmall) => {
                res(fontSizeSmall === '1');
            }).catch(() => {
                res(false);
            });
        });
    }

    async setFontSizeSmall(fontSizeSmall): Promise<void> {
        if (!fontSizeSmall) {
            await this.storage.remove('font-size-small');
            return;
        }
        await this.storage.set('font-size-small', fontSizeSmall ? '1' : '0');
    }

    setLastBackup(dateTime: string): void {
        this.storage.set('last-backup', dateTime);
    }

    removeLastBackup() {
        return this.storage.remove('last-backup');
    }

    setCurrentCurrency(currency: string = 'USD'): Promise<any> {
        return this.storage.set('current-currency', currency);
    }

    getCurrentCurrency(): Promise<string> {
        return this.getStringAttribute('current-currency', this.currentCurrency);
    }

    removeCurrentCurrency() {
        return this.storage.remove('current-currency');
    }

    setDateFormat(dateFormat: string = 'DD/MM/YYYY'): Promise<any> {
        return this.storage.set('date-format', dateFormat);
    }

    getDateFormat(): Promise<string> {
        return this.getStringAttribute('date-format', this.currentDateFormat);
    }

    removeDateFormat() {
        return this.storage.remove('date-format');
    }

    setTimeFormat(timeFormat: string = 'HH:mm'): Promise<any> {
        return this.storage.set('time-format', timeFormat);
    }

    getTimeFormat(): Promise<string> {
        return this.getStringAttribute('time-format', this.currentTimeFormat);
    }

    removeTimeFormat() {
        return this.storage.remove('time-format');
    }

    setOutstock(outStock: boolean = false): Promise<any> {
        return this.storage.set('out-stock', outStock ? '1' : '0');
    }

    setPrintOrderLikeInvoice(printOrderLikeInvoice: boolean = false): Promise<any> {
        return this.storage.set('print-order-like-invoice', printOrderLikeInvoice ? '1' : '0');
    }

    setHideTax(hideTax: boolean = false): Promise<any> {
        return this.storage.set('hide-tax', hideTax ? '1' : '0');
    }

    setHideTablesFunction(hideTablesFunction: boolean = false): Promise<any> {
        return this.storage.set('hide-tables-function', hideTablesFunction ? '1' : '0');
    }

    setHideCalendarFunction(hideCalendarFunction: boolean = false): Promise<any> {
        return this.storage.set('hide-calendar-function', hideCalendarFunction ? '1' : '0');
    }

    setCurrencySymbolToTheRight(currencySymbolToTheRight: boolean = false): Promise<any> {
        return this.storage.set('currency-symbol-to-the-right', currencySymbolToTheRight ? '1' : '0');
    }

    setOrderInvoiceMaxEmptyRows(orderInvoiceMaxEmptyRows: number = 10): Promise<any> {
        return this.storage.set('order-invoice-max-empty-rows', orderInvoiceMaxEmptyRows + '');
    }

    setHideDiscountColumn(hideDiscountColumn: boolean = true): Promise<any> {
        return this.storage.set('hide-discount-column', hideDiscountColumn ? '1' : '0');
    }

    setShowStaffNameUnderSign(showStaffNameUnderSign: boolean = false): Promise<any> {
        return this.storage.set('show-staff-name-under-sign', showStaffNameUnderSign ? '1' : '0');
    }

    setHideProductCodePrint(hideProductCodePrint: boolean = true): Promise<any> {
        return this.storage.set('hide-product-code-print', hideProductCodePrint ? '1' : '0');
    }

    setHideMaterials(hideMaterials: boolean = false): Promise<any> {
        return this.storage.set('hide-materials', hideMaterials ? '1' : '0');
    }

    setOrderFormCollapsed(outStock: boolean = false): Promise<any> {
        return this.storage.set('order-form-collapsed', outStock ? '1' : '0');
    }

    getOutstock(): Promise<boolean> {
        return this.getBooleanAttribute('out-stock', this.currentOutstock);
    }

    getPrintOrderLikeInvoice(): Promise<boolean> {
        return this.getBooleanAttribute('print-order-like-invoice', this.currentPrintOrderLikeInvoice);
    }

    getHideTax(): Promise<boolean> {
        return this.getBooleanAttribute('hide-tax', this.currentHideTax);
    }

    getHideTablesFunction(): Promise<boolean> {
        return this.getBooleanAttribute('hide-tables-function', this.currentHideTablesFunction);
    }

    getHideCalendarFunction(): Promise<boolean> {
        return this.getBooleanAttribute('hide-calendar-function', this.currentHideCalendarFunction);
    }

    getCurrencySymbolToTheRight(): Promise<boolean> {
        return this.getBooleanAttribute('currency-symbol-to-the-right', this.currentCurrencySymbolToTheRight);
    }

    getOrderInvoiceMaxEmptyRows(): Promise<number> {
        return new Promise((res, j) => {
            this.storage.get('order-invoice-max-empty-rows').then((outStockStr) => {
                if (outStockStr && outStockStr != '') {
                    res(+outStockStr);
                } else {
                    res(this.currentOrderInvoiceMaxEmptyRows);
                }
            }).catch(() => {
                res(this.currentOrderInvoiceMaxEmptyRows);
            });
        });
    }

    getHideDiscountColumn(): Promise<boolean> {
        return this.getBooleanAttribute('hide-discount-column', this.currentHideDiscountColumn);
    }

    getShowStaffNameUnderSign(): Promise<boolean> {
        return this.getBooleanAttribute('show-staff-name-under-sign', this.currentShowStaffNameUnderSign);
    }

    getHideProductCodePrint(): Promise<boolean> {
        return this.getBooleanAttribute('hide-product-code-print', this.currentHideProductCodePrint);
    }

    getHideMaterials(): Promise<boolean> {
        return this.getBooleanAttribute('hide-materials', this.currentHideMaterials);
    }

    getOrderFormCollapsed(): Promise<boolean> {
        return this.getBooleanAttribute('order-form-collapsed', this.defaultOrderFormCollapsed);
    }

    getBooleanAttribute(name: string, defaultVal: boolean): Promise<boolean> {
        return new Promise((res, j) => {
            this.storage.get(name).then((val) => {
                if (val && val !== '') {
                    res(val == '1');
                } else {
                    res(defaultVal);
                }
            }).catch(() => {
                res(defaultVal);
            });
        });
    }

    getStringAttribute(name: string, defaultVal: string): Promise<string> {
        return new Promise((res, j) => {
            this.storage.get(name).then((val) => {
                if (val && val !== '') {
                    res(val);
                } else {
                    res(defaultVal);
                }
            }).catch(() => {
                res(defaultVal);
            });
        });
    }

    removeOrderFormCollapsed() {
        return this.storage.remove('order-form-collapsed');
    }

    removeOutstock() {
        return this.storage.remove('out-stock');
    }

    get(id: number): Promise<IUser> {
        const user = new User();
        user.id = id;
        return null;// this.sql.getObject(Helper.userTableName, user);
    }

    loginUserSync(username: string, password: string): Promise<any> {
        return new Promise((r, j) => {
            if (!username || !password) {
                this.navCtrl.publish('loggedUser');
                r(null);
                return;
            }
            const formData = new FormData();
            formData.append('client_id', 'atakafe.web');
            formData.append('client_secret', 'atk66688899@2018');
            formData.append('grant_type', 'password');
            formData.append('scope', 'atakafe.api offline_access');
            formData.append('username', username);
            formData.append('password', password);
            const url = 'https://atakafe.com/auth/connect/token';
            // const url = 'http://localhost:5000/connect/token';
            this.http.post(url, formData).subscribe((res: any) => {
                if (res) {
                    const data = res;
                    const user = new User();
                    user.username = username;
                    user.password = password;
                    this.token = data.access_token;
                    r(user);
                    return;
                }
                r(false);
            }, (err) => {
                r(false);
            });
        });
    }

    getUserByNameAndPassword(username: string, password: string, isRemember: boolean): Promise<any> {
        return new Promise((r, j) => {
            if (!username || !password) {
                this.navCtrl.publish('loggedUser');
                r(null);
            }
            const formData = new FormData();
            formData.append('client_id', 'atakafe.web');
            formData.append('client_secret', 'atk66688899@2018');
            formData.append('grant_type', 'password');
            formData.append('scope', 'atakafe.api offline_access');
            formData.append('username', username);
            formData.append('password', password);
            const url = 'https://atakafe.com/auth/connect/token';
            // const url = 'http://localhost:5000/connect/token';
            this.http.post(url, formData).subscribe((res) => {
                if (res) {
                    const data = res as any;
                    const user = new User();
                    user.username = username;
                    user.password = password;
                    this.loggedUser = user;
                    this.token = data.access_token;
                    const refreshToken = data.refresh_token;
                    if (isRemember) {
                        this.setRefreshToken({ refreshToken, userName: username, pass: password }).then(() => { });
                    }
                    this.setLastLogin({ refreshToken, userName: username, pass: password }).then(() => { });
                    r(user);
                    return;
                }
                r(false);
            }, (err) => {
                if (!navigator.onLine) {
                    alert('Check your internet connection - Kiểm tra lại kết nối mạng.');
                }
                console.error(err);
                r(false);
            });
        });
    }

    register(username: string, password: string, shop: string): Promise<any> {
        return new Promise<any>((resolve, rej) => {
            const data = { email: username, password, displayName: shop, gender: 'undefined' };
            this.http.post(this.authenApiUrl + '/user/signup', data).subscribe((result: any) => {
                if (result && result.status === 200) {
                    const json = result;
                    if (json) {
                        const user = new User();
                        user.username = username.toLowerCase();
                        user.password = '';
                        resolve(1);
                        return;
                    }
                }
                resolve(0);
            });
        });
    }

    setLoggedUser(user: IUser, reload: boolean = true): void {
        this.loggedUser = user;
        if (this.loggedUser) {
            this.analyticsService.setUserId(user.username);
        }
        if (reload) {
            this.navCtrl.publish('loggedUser');
        }
    }

    saveUser(user: IUser, oldPassword: string = '', tryCount: number = 0): Promise<number> {
        return new Promise<any>((r, rej) => {
            if (tryCount === 3) {
                r(0);
                return;
            }
            const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
            headers.append('Authorization', 'Bearer ' + this.token);
            const option = {
                headers
            };
            const data = { newPassword: user.password, oldPassword };
            this.http.post(this.authenApiUrl + '/user/UpdatePassword', data, option).subscribe((result: any) => {
                if (result && result.status === 200) {
                    const json = result;
                    if (json) {
                        this.getUserByNameAndPassword(user.username, user.password, user.isRemember).then((res) => {
                            if (res) {
                                r(1);
                                return;
                            }
                            r(0);
                        }).catch(() => {
                            r(0);
                        });
                        return;
                    }
                }
                r(0);
            }, () => {
                // try to login again
                if (!navigator.onLine) {
                    alert('Check your internet connection - Kiểm tra lại kết nối mạng.');
                    r(0);
                    return;
                }
                this.getRefreshToken()
                    .then((tokenData) => {
                        if (!tokenData) {
                            r(0);
                            return;
                        }
                        const userName = tokenData.userName;
                        const pass = tokenData.pass;
                        this.getUserByNameAndPassword(userName, pass, user.isRemember)
                            .then((userResult) => {
                                if (!userResult) {
                                    this.removeRefreshToken();
                                    r(0);
                                    return;
                                }
                                this.saveUser(userResult, oldPassword, tryCount + 1).then((res) => {
                                    r(res);
                                })
                                    .catch(() => {
                                        r(0);
                                    });
                            }).catch(() => {
                                r(0);
                            });
                    });
            });
        });
    }

    deleteUser(): Promise<any> {
        if (this.loggedUser) {
            const username = this.loggedUser.username;
            const filter = Helper.userTableName + '.username = \'' + username + '\'';
            return null;// this.sql.deleteObject(Helper.userTableName, null, filter);
        }
        return Promise.resolve(false);
    }

    disableLogin(): Promise<any> {
        const p = this.storage.set('disable-login', 'true') as Promise<any>;
        this.isDisableLogin = true;
        return p;
    }

    setRefreshToken(data: { refreshToken: string; userName: string; pass: string }): Promise<any> {
        const str = JSON.stringify(data);
        const p = this.storage.set('refresh-token', str) as Promise<any>;
        return p;
    }

    removeRefreshToken(): Promise<any> {
        this.token = '';
        const p = this.storage.remove('refresh-token') as Promise<any>;
        return p;
    }

    getRefreshToken(): Promise<any> {
        return new Promise<any>((res, rej) => {
            this.storage.get('refresh-token').then((item) => {
                if (item) {
                    const data = JSON.parse(item);
                    res(data);
                } else {
                    res(null);
                }
            }).catch(() => {
                rej(null);
            });
        });
    }

    setLastLogin(data: { refreshToken: string; userName: string; pass: string }): Promise<any> {
        const str = JSON.stringify(data);
        const p = this.storage.set('last-login', str) as Promise<any>;
        return p;
    }

    removeLastLogin(): Promise<any> {
        this.token = '';
        const p = this.storage.remove('last-login') as Promise<any>;
        return p;
    }

    getLastLogin(): Promise<any> {
        return new Promise<any>((res, rej) => {
            this.storage.get('last-login').then((item) => {
                if (item) {
                    const data = JSON.parse(item);
                    res(data);
                } else {
                    res(null);
                }
            }).catch(() => {
                rej(null);
            });
        });
    }

    enableLogin(): Promise<any> {
        const p = this.storage.remove('disable-login') as Promise<any>;
        this.isDisableLogin = false;
        return p;
    }

    isEnableLogin(): Promise<boolean> {
        return new Promise<boolean>((res, rej) => {
            this.storage.get('disable-login').then((item) => {
                if (item) {
                    this.isDisableLogin = true;
                    res(false);
                } else {
                    this.isDisableLogin = false;
                    res(true);
                }
            }).catch(() => {
                rej(null);
            });
        });
    }

    shareScreenshot(body?: string): Promise<any> {
        return new Promise(async (r, j) => {
            const link = this.translateService.instant('share.link-android');
            const bodyHint = this.translateService.instant('share.paste-hint');

            const modal = await this.modalCtrl.create({ component: ShareSelectComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (this.navCtrl.isNotCordova()) {
                r('ok');
                return;
            }
            if (data === 'facebook') {
                /* this.screenshot.URI().then((res) => {
                    this.socialSharing.shareViaFacebookWithPasteMessageHint(body, res.URI, link, bodyHint).then(() => {
                        r('ok');
                    }).catch((err) => {
                        r('ok');
                    });
                }); */
                return;
            }
            if (data === 'twitter') {
                /* this.screenshot.URI().then((res) => {
                    this.socialSharing.shareViaTwitter(body, res.URI, link).then(() => {
                        r('ok');
                    }).catch(() => {
                        r('ok');
                    });
                }); */
                return;
            }
            if (data === 'instagram') {
                /* this.screenshot.URI().then((res) => {
                    this.socialSharing.shareViaInstagram(body, res.URI).then(() => {
                        r('ok');
                    }).catch(() => {
                        r('ok');
                    });
                }); */
                return;
            }
            if (data === 'whatsapp') {
                /* this.screenshot.URI().then((res) => {
                    this.socialSharing.shareViaWhatsApp(body, res.URI, link).then(() => {
                        r('ok');
                    }).catch(() => {
                        r('ok');
                    });
                }); */
                return;
            }

            if (data === 'mail') {
                /* this.screenshot.URI().then((res) => {
                    this.socialSharing.shareViaEmail(body + ' ' + link, '', [], null, null, res.URI).then(() => {
                        r('ok');
                    }).catch(() => {
                        r('ok');
                    });
                }); */
                return;
            }
            if (data === 'sms') {
                this.socialSharing.shareViaSMS(body, null).then(() => {
                    r('ok');
                }).catch(() => {
                    r('ok');
                });
                return;
            }
        });
    }

    async share(body?: string, image?: string): Promise<void> {
        const link = this.translateService.instant('share.link-android');
        const bodyHint = this.translateService.instant('share.paste-hint');

        const modal = await this.modalCtrl.create({ component: ShareSelectComponent });
        const { data } = await modal.onDidDismiss();
        await modal.present();
        if (this.navCtrl.isNotCordova()) {
            return;
        }

        if (data === 'facebook') {
            this.socialSharing.shareViaFacebookWithPasteMessageHint(body, image, link, bodyHint).then(() => {
            }).catch(() => {
            });
            return;
        }
        if (data === 'twitter') {
            this.socialSharing.shareViaTwitter(body, image, link).then(() => {
            }).catch(() => {
            });
            return;
        }
        if (data === 'instagram') {
            this.socialSharing.shareViaInstagram(body, image).then(() => {
            }).catch(() => {
            });
            return;
        }
        if (data === 'whatsapp') {
            this.socialSharing.shareViaWhatsApp(body, image, link).then(() => {
            }).catch(() => {
            });
            return;
        }
        if (data === 'mail') {
            this.socialSharing.shareViaEmail(body + ' ' + link, '', [], null, null, image).then(() => {
            }).catch(() => {
            });
            return;
        }
        if (data === 'sms') {
            this.socialSharing.shareViaSMS(body, null).then(() => {
            }).catch(() => {
            });
            return;
        }
    }

    shareFile(body?: string, fileBase64?: string): void {
        if (this.navCtrl.isNotCordova()) {
            return;
        }

        this.socialSharing.shareViaEmail(body, '', [], null, null, fileBase64).then(() => {
        }).catch(() => {
        });
    }

    async shareFileNormal(body?: string, fileBase64?: string): Promise<void> {
        if (this.navCtrl.isNotCordova()) {
            return await Promise.resolve(null);
        }

        await this.socialSharing.share(body, '', fileBase64).then(() => {
        }).catch(() => {
        });
    }

    shareFileUrl(message: string, subject: string, fileUrl: string): void {
        if (this.navCtrl.isNotCordova()) {
            return;
        }

        this.socialSharing.share(message, subject, fileUrl).then(() => {
        }).catch((err) => {
            console.error(err);
        });
    }

    shareText(message: string) {
        if (this.navCtrl.isNotCordova()) {
            return;
        }

        return this.socialSharing.share(message);
    }
}
