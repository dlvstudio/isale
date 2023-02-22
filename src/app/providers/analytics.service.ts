import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';

declare let gtag;

@Injectable()
export class AnalyticsService {
    constructor(
        private firebaseX: FirebaseX,
        private platform: Platform,
    ) {
        this.firebaseX.setAnalyticsCollectionEnabled(true);
     }

    async setCurrentScreen(name) {
        if (typeof gtag !== 'undefined' && gtag) {
            gtag('event', 'page_view', {
                page_title: name,
                page_location: '/' + name,
                page_path: document.URL
            });
        }
        if (this.isNotCordova()) {
            return Promise.resolve('ok');
        }
        const arr = [];
        arr.push(this.firebaseX.logEvent('screen_view', { screen_name: name, screen_class: "MainActivity" }));
        await Promise.all(arr);
    }

    async logEvent(event, data = null) {
        const eventName = event.split('-').join('_');
        if (typeof gtag !== 'undefined' && gtag) {
            gtag('event', eventName);
        }
        if (this.isNotCordova()) {
            return Promise.resolve('ok');
        }
        const arr = [];
        arr.push(this.firebaseX.logEvent(eventName, { content_type: event, item_id: data ? data : 'none' }));
        await Promise.all(arr);
    }

    async logError(event, data = null) {
        if (this.isNotCordova()) {
            console.error('logError', event, data);
            return Promise.resolve('ok');
        }
        const arr = [];
        arr.push(this.firebaseX.logError(event, data));
        await Promise.all(arr);
    }

    async setUserId(id) {
        if (this.isNotCordova()) {
            return Promise.resolve('ok');
        }
        const arr = [];
        arr.push(this.firebaseX.setUserId(id));
        await Promise.all(arr);
    }

    isNotCordova() {
        return (!(this.platform.is('capacitor') || this.platform.is('cordova'))
            || this.platform.is('electron')
            || document.URL.indexOf('atakafe./isale') !== -1 || document.URL.indexOf('isale.online/app') !== -1
            // || document.URL.indexOf('localhost') !== -1
        );
    }
}
