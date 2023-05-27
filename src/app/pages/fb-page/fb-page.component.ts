import { Component } from '@angular/core';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { UserService } from '../../providers/user.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { OmniChannelService } from '../../providers/omni-channel.service';
import { callFBAPI } from '../../providers/helper';
import { DateTimeService } from '../../providers/datetime.service';
import { PlanService } from '../../providers/plan.service';
import { ModalController } from '@ionic/angular';

declare let FB;

@Component({
    selector: 'fb-page',
    templateUrl: 'fb-page.component.html'
})
export class FbPageComponent {
    flowSearchKey = '';
    originalPosts: any[];
    posts: any[];
    postSearchKey = '';
    currency: string;
    tab = 'page';
    totalUnRead = 0;
    totalUnReadComment = 0;
    searchKey = '';
    originalFlows: any[];
    originals: any[];
    items: any[];
    flows: any[];
    currentPlan: any = null;
    isOnTrial = false;
    params;
    searchMode = false;
    callback;

    constructor(
        private omniChannelService: OmniChannelService,
        public navCtrl: RouteHelperService,
        private modalController: ModalController,
        public translateService: TranslateService,
        private userService: UserService,
        private planService: PlanService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadFbPageList', this.reload);
        this.navCtrl.subscribe('reloadFbPageList', this.reload);
    }

    openBrowser() {
        this.navCtrl.openExternalUrl('https://isale.online/app');
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('money-account');
    }

    ngOnInit(): void {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.searchMode) {
            this.searchMode = this.params.searchMode;
        }
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currentPlan = await this.planService.getCurrentPlan();
        if (!this.currentPlan) {
            this.isOnTrial = await this.planService.isOnTrial(this.currentPlan);
        }
        this.currency = await this.userService.getAttr('current-currency');
        await this.omniChannelService.getPages().then(async (pages) => {
            this.originals = JSON.parse(JSON.stringify(pages));
            this.items = pages;
        });
        await this.omniChannelService.getMessageFlows().then(async (chatflows) => {
            const chatflows2 = _.orderBy(chatflows, ['lastTimestamp'], ['desc']);
            this.originalFlows = JSON.parse(JSON.stringify(chatflows2));
            this.flows = chatflows2;
            const filtered = (_.filter(chatflows2, f => !f.isRead));
            this.totalUnRead = filtered.length;
        });
        await this.omniChannelService.getPosts().then(async (posts) => {
            const posts2 = _.orderBy(posts, ['lastTimestamp'], ['desc']);
            this.originalPosts = JSON.parse(JSON.stringify(posts2));
            this.posts = posts2;
            const filtered = (_.filter(posts2, f => !f.isRead));
            this.totalUnReadComment = filtered.length;
        });
        await loading.dismiss();
    }

    dateFormat(date: any): any {
        let dateChanged: any = date;
        if (dateChanged && dateChanged instanceof Date) {
            return dateChanged;
        }
        if (date && date.indexOf(':00Z') < 0 ) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    validPlan(): boolean {
        if (!this.currentPlan && !this.isOnTrial) {
            this.analyticsService.logEvent('register-pro-alert');
            alert(this.translateService.instant('common.register-pro-alert'));
            return false;
        }
        return true;
    }

    selectPost(post): void {
        if (!this.validPlan()) {
            return;
        }
        this.navCtrl.push('/fbpage/comments', {post});
    }

    async selectPage(page): Promise<void> {
        if (!this.validPlan()) {
            return;
        }
        if (this.searchMode) {
            if (this.callback) {
                this.callback(page);
                await this.navCtrl.back();
                return;
            }
            this.modalController.dismiss(page);
            return;
        }
        this.navCtrl.push('/fbpage/detail', {id: page.id});
    }

    selectFlow(flow): void {
        if (!this.validPlan()) {
            return;
        }
        this.navCtrl.push('/fbpage/messages', {flow});
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('fb-page-search');
        let pages: any[] = JSON.parse(JSON.stringify(this.originals));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            pages = pages.filter((item) => (
                item.name && Helper.stringSpecialContains(searchKey, item.name)
                || item.pageId && Helper.stringSpecialContains(searchKey, item.pageId)
            ));
        }
        this.items = pages;
    }

    async searchFlow(): Promise<void> {
        this.analyticsService.logEvent('fb-page-search-flow');
        let flows: any[] = JSON.parse(JSON.stringify(this.originalFlows));
        if (this.flowSearchKey !== null && this.flowSearchKey !== '') {
            const searchKey = this.flowSearchKey.toLowerCase();
            flows = flows.filter((item) => (
                item.fromUserName && Helper.stringSpecialContains(searchKey, item.fromUserName)
                || item.pageId && Helper.stringSpecialContains(searchKey, item.pageId)
                || item.pageName && Helper.stringSpecialContains(searchKey, item.pageName)
                || item.lastMessage && Helper.stringSpecialContains(searchKey, item.lastMessage)
            ));
        }
        this.flows = flows;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    clearSearchFlow() {
        this.flowSearchKey = null;
        this.reload();
    }

    loginFacebook() {
        if (!this.validPlan()) {
            return;
        }
        FB.getLoginStatus(async (response) => {
            if (response.status === 'connected') {
                if (response.authResponse) {
                    await this.omniChannelService.updateFbToken(response.authResponse.userID, response.authResponse.accessToken);
                }
                await this.readPages();
            } else if (response.status === 'not_authorized') {
                this.doLoginFacebook();
            } else {
                this.doLoginFacebook();
            }
        });
    }

    doLoginFacebook() {
        FB.login((response) => {
            if (response.status === 'connected') {   // Logged into your webpage and Facebook.
                this.readPages();
            } else {                                 // Not logged into your webpage or we are unable to tell.
                alert(this.translateService.instant('fb-page.login-fail-alert'));
            }

        }, { scope: 'public_profile,pages_show_list,pages_manage_metadata,pages_messaging,pages_manage_engagement,user_videos' });
    }

    async readPages() {
        const loading = await this.navCtrl.loading();
        const response = await callFBAPI('/me/accounts', null, null);
        if (!response || !response.data || !response.data.length) {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
            await loading.dismiss();
            return;
        }
        const connectedPages = await this.omniChannelService.getPages();
        if (!connectedPages || !connectedPages.length) {
            await loading.dismiss();
            return;
        }
        for (const pageItem of response.data) {
            const connectedPage = connectedPages.find(c => c.isConnected && c.pageId == pageItem.id);
            if (connectedPage) {
                continue;
            }
            const existPage = connectedPages.find(c => c.pageId == pageItem.id);
            await this.subscribeApps(pageItem, existPage);
        }
        alert(this.translateService.instant('fb-page.connected-successfully'));
        await loading.dismiss();
        await this.reload();
    }

    async subscribeApps(pageItem, existPage) {
        const response = await callFBAPI(
            '/' + pageItem.id + "/subscribed_apps",
            "POST",
            {
                subscribed_fields: "feed,messages",
                access_token: pageItem.access_token
            });
        if (response && !response.error) {
            /* handle the result */
            if (!existPage) {
                existPage = {
                    id: 0,
                    pageId: pageItem.id,
                    accessToken: pageItem.access_token,
                    name: pageItem.name,
                    isConnected: true
                }
            } else {
                existPage.isConnected = true;
                existPage.accessToken = pageItem.access_token;
                existPage.name = pageItem.name;
            }
            await this.omniChannelService.savePage(existPage);
        } else {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
        }
    }

    autoReplyConfig() {
        if (!this.validPlan()) {
            return;
        }
        this.navCtrl.push('/fbpage/auto-reply');
    }

    openLiveStream() {
        if (!this.validPlan()) {
            return;
        }
        this.navCtrl.push('/fbpage/livestream');
    }

    autoOrder() {
        if (!this.validPlan()) {
            return;
        }
        this.navCtrl.push('/fbpage/auto-order');
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.modalController.dismiss();
    }
}
