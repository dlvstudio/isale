import { Injectable } from '@angular/core';
import { LoadingController, NavController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';


@Injectable()
export class RouteHelperService {
    private params: any;
    private isOnReview = false;
    private hasAdsCheck = false;

    constructor(
        private nav: NavController,
        private platform: Platform,
        private loadingCtrl: LoadingController,
        private translateService: TranslateService,
        private iab: InAppBrowser
    ) {
    }

    setHasAds(hasAds: boolean) {
        this.hasAdsCheck = hasAds;
    }

    hasAds(): boolean {
        return this.hasAdsCheck;
    }


    async loading(duration?: number) {
        const loading = await this.loadingCtrl.create({
            message: this.translateService.instant('common.loading'),
            duration: duration ? duration : 7000,
        });
        await loading.present();
        return loading;
    }

    async home() {
        await this.nav.navigateRoot('/home');
    }

    back() {
        this.nav.back();
    }

    async popOnly() {
        await this.nav.pop();
    }

    pop() {
        this.back();
    }

    async push(path: string, params: any = null) {
        await this.navigateForward(path, params);
    }

    async navigateForward(path: string, params: any = null) {
        this.params = params;
        await this.nav.navigateForward(path);
    }

    async navigateRoot(path: string, params: any = null) {
        this.params = params;
        await this.nav.navigateRoot(path);
    }

    getParams(oldParams = null) {
        return oldParams ? oldParams : this.params;
    }

    publish(name, obj = null) {
        this.dispatchEvent(name, obj);
    }

    dispatchEvent(name, obj = null) {
        window.dispatchEvent(new CustomEvent(name, { detail: obj }));
    }

    unsubscribe(name, handle) {
        window.removeEventListener(name, handle);
    }

    subscribe(name, handle) {
        window.addEventListener(name, handle);
    }

    removeEventListener(name, handle) {
        window.removeEventListener(name, handle);
    }

    addEventListener(name, handle) {
        window.addEventListener(name, handle);
    }

    isNotCordova() {
        return (!(this.platform.is('capacitor') || this.platform.is('cordova'))
            || this.platform.is('electron')
            || document.URL.indexOf('atakafe.com/isale') !== -1 || document.URL.indexOf('isale.online/app') !== -1
            // || document.URL.indexOf('localhost:8100') !== -1
        );
    }

    isIos() {
        return this.platform.is('ios');
    }

    isIosReview() {
        return this.platform.is('ios') && this.isOnReview;
    }

    isAndroid() {
        return this.platform.is('android');
    }

    isWeb() {
        return document.URL.indexOf('atakafe.com/isale') !== -1 || document.URL.indexOf('isale.online/app') !== -1;
    }

    openExternalUrl(url) {
        this.iab.create(url, '_system', 'location=yes');
    }
}
