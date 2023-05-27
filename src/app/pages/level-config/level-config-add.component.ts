import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { PointService } from '../../providers/point.service';
import { UserService } from '../../providers/user.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'level-config-add',
    templateUrl: 'level-config-add.component.html',
})
export class LevelConfigAddComponent {
    params: any = null;
    config: any = {buyCount: 0};
    fromSearch = false;
    saveDisabled = false;
    currency: any;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private pointService: PointService,
        private userService: UserService,
        private analyticsService: AnalyticsService,
    ) {
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('level-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currency = await this.userService.getAttr('current-currency');
        this.config = {buyCount: 0};
        let configId = 0;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id) {
            configId = this.params.id;
        }

        if (configId && configId > 0) {
            this.pointService.getLevelConfig(configId).then((config) => {
                this.config = config;
            });
        }
    }

    validate(): boolean {
        if (!this.config.title) {
            alert(this.translateService.instant('point-add.no-level-title'));
            return false;
        }
        if (!this.config.point) {
            alert(this.translateService.instant('point-add.no-level-point'));
            return false;
        }
        return true;
    }

    async save(): Promise<void> {
        if (!this.validate()) {
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.pointService.saveLevelConfig(this.config).then(async () => {
            this.analyticsService.logEvent('level-config-save-successfully');
            this.saveDisabled = false;
            await loading.dismiss();
            this.exitPage();
        }).catch(async () => {
            this.saveDisabled = false;
            await loading.dismiss();
        });
    }

    async dismiss() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
    }

    async exitPage() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
        this.navCtrl.publish('reloadLevelConfigList', null);
        this.navCtrl.publish('reloadPointConfigList', null);
        this.navCtrl.publish('reloadPointConfig', this.config);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    contactImageOrPlaceholder(contact: any): string {
        return Helper.contactImageOrPlaceholder(contact.iconUrl);
    }
}
