import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { AnalyticsService } from '../../providers/analytics.service';
import { OmniChannelService } from '../../providers/omni-channel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AlertController } from '@ionic/angular';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'fb-notifications',
    templateUrl: 'fb-notifications.component.html'
})
export class FbNotificationsComponent {
    params: any = null;
    originals: any[];
    messages: any[];
    searchKey;
    multiSelect = false;
    selectedAll = false;

    constructor(
        private omniChannelService: OmniChannelService,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController
    ) {
        this.navCtrl.unsubscribe('reloadFbNotifications', this.reload);
        this.navCtrl.subscribe('reloadFbNotifications', this.reload);
    }

    ionViewWillLeave() {
        this.navCtrl.unsubscribe('fbmessage', this.reload);
    }

    async ionViewWillEnter() {
        this.navCtrl.subscribe('fbmessage', this.reload);
        await this.analyticsService.setCurrentScreen('fb-notifications');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.omniChannelService.setRecentNotification(false);
        this.navCtrl.publish('recentNoti', false);
        this.omniChannelService.getNotificationsFromStorage().then(async (messages) => {
            const filtered = messages.filter(f => f.fromUser);
            this.originals = JSON.parse(JSON.stringify(filtered));
            this.messages = filtered;
            await loading.dismiss();
        });
    }

    dateFormat(date: string): string {
        const now = date ? moment(date) : moment();
        let dateChanged = date;
        if (!date || date.indexOf(':00Z') < 0) {
            dateChanged = now.format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    async selectMessage(message) {
        if (this.multiSelect) {
            return;
        }
        if (message.isComment) {
            const post = await this.omniChannelService.getPostByComment(message);
            if (!post) {
                return;
            }
            this.navCtrl.push('/fbpage/comments', { post });
            return;
        }
        const flow = await this.omniChannelService.getMessageFlowByMessage(message);
        if (!flow) {
            return;
        }
        this.navCtrl.push('/fbpage/messages', { flow });
    }

    async deleteNoti(message) {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('fb-page.delete-notification-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.omniChannelService.deleteNotification(message).then(async () => {
                            this.analyticsService.logEvent('notification-delete-success');
                            this.navCtrl.publish('reloadFbNotifications', null);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async deleteMultiNoti() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('fb-page.delete-multi-notification-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        for (const message of this.messages) {
                            if (message.selected) {
                                await this.omniChannelService.deleteNotification(message);
                            }
                        }
                        this.analyticsService.logEvent('notification-delete-success');
                        this.navCtrl.publish('reloadFbNotifications', null);
                    }
                },
            ]
        });
        await confirm.present();
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('fb-messageflow-search');
        let messages: any[] = JSON.parse(JSON.stringify(this.originals));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            messages = messages.filter((item) => (
                item.message && Helper.stringSpecialContains(searchKey, item.message)
                || item.pageId && Helper.stringSpecialContains(searchKey, item.pageId)
                || item.pageName && Helper.stringSpecialContains(searchKey, item.pageName)
            ));
        }
        this.messages = messages;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    selectMulti() {
        this.multiSelect = !this.multiSelect;
    }

    changeSelectedAll() {
        for (const message of this.messages) {
            message.selected = this.selectedAll;
        }
    }
}
