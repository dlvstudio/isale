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

    constructor(
        private omniChannelService: OmniChannelService,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private userService: UserService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadFbPageList', this.reload);
        this.navCtrl.subscribe('reloadFbPageList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('money-account');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getCurrentCurrency();
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

    dateFormat(date: string): string {
        let dateChanged = date;
        if (date.indexOf(':00Z') < 0 ) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    selectPost(post): void {
        this.navCtrl.push('/fbpage/comments', {post});
    }

    selectPage(id): void {
        this.navCtrl.push('/fbpage/detail', {id});
    }

    selectFlow(flow): void {
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
        const response = await callFBAPI('/me/accounts', null, null);
        if (!response || !response.data || !response.data.length) {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
            return;
        }
        const connectedPages = await this.omniChannelService.getPages();
        for (const pageItem of response.data) {
            const isConnected = connectedPages && connectedPages.length
                && connectedPages.find(c => c.isConnected && c.pageId == pageItem.id) !== null;
            if (isConnected) {
                continue;
            }
            await this.subscribeApps(pageItem);
        }
        alert(this.translateService.instant('fb-page.connected-successfully'));
        await this.reload();
    }

    async subscribeApps(pageItem) {
        const response = await callFBAPI(
            '/' + pageItem.id + "/subscribed_apps",
            "POST",
            {
                subscribed_fields: "feed,messages",
                access_token: pageItem.access_token
            });
        if (response && !response.error) {
            /* handle the result */
            const page = {
                id: 0,
                pageId: pageItem.id,
                accessToken: pageItem.access_token,
                name: pageItem.name,
                isConnected: true
            }
            await this.omniChannelService.savePage(page);
        } else {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
        }
    }

    autoReplyConfig() {
        this.navCtrl.push('/fbpage/auto-reply');
    }

    openLiveStream() {
        this.navCtrl.push('/fbpage/livestream');
    }

    autoOrder() {
        this.navCtrl.push('/fbpage/auto-order');
    }
}
