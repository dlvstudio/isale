import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ContactService } from '../../providers/contact.service';
import { StaffService } from '../../providers/staff.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'business-type-add',
    templateUrl: 'business-type-add.component.html',
})
export class BusinessTypeAddComponent {
    params: any = null;
    businessType: any;
    isNew = true;
    fromSearch = false;
    saveDisabled = false;

    constructor(public navCtrl: RouteHelperService,
                private contactService: ContactService,
                public staffService: StaffService,
                private analyticsService: AnalyticsService
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
        await this.analyticsService.setCurrentScreen('business-type-add');
    }

    async ngOnInit(): Promise<void> {
        this.businessType  = {};
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.isNew = false;
            const loading = await this.navCtrl.loading();
            this.contactService.getBusinessType(id).then(async (businessType) => {
                await loading.dismiss();
                this.businessType = businessType;
            });
        }
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.saveDisabled = true;
        this.contactService.saveBusinessType(this.businessType).then(async () => {
            this.analyticsService.logEvent('save-business-type-success');
            await loading.dismiss();
            this.exitPage();
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
        this.navCtrl.publish('reloadBusinessTypeList');
        this.navCtrl.publish('reloadBusinessType', this.businessType);
    }
}
