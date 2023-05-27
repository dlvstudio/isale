import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ContactService } from '../../providers/contact.service';
import { StaffService } from '../../providers/staff.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'edit-point',
    templateUrl: 'edit-point.component.html',
})
export class EditPointComponent {
    params: any = null;
    contactPoint: any =  {id: 0, point: 0, levelId: 0};
    storageDirectory = '';
    date: string;
    isNew = true;
    saveDisabled = false;
    levelSelected;

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
        await this.analyticsService.setCurrentScreen('edit-point');
    }

    async ngOnInit(): Promise<void> {
        this.contactPoint = {id: 0, point: 0, levelId: 0};
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.isNew = false;
            const loading = await this.navCtrl.loading();
            this.contactService.get(id).then(async (contact) => {
                await loading.dismiss();
                this.contactPoint = {id: contact.id, point: contact.point, levelId: contact.levelId, staffId: contact.staffId};
                this.levelSelected = contact.level;
            });
        }
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.saveDisabled = true;
        if (this.staffService.isStaff() && this.contactPoint.staffId === 0) {
            this.contactPoint.staffId = this.staffService.selectedStaff.id;
        }
        this.contactService.updatePoint(this.contactPoint).then(async () => {
            this.analyticsService.logEvent('edit-point-save-success');
            await loading.dismiss();
            this.exitPage();
        });
    }

    async dismiss() {
        await this.navCtrl.popOnly();
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadContactList', { filter : 'all' });
        this.navCtrl.publish('reloadContact', this.contactPoint);
    }

    async showLevels() {
        this.analyticsService.logEvent('edit-point-search-level');
        const callback = async (data) => {
            const item = data;
            if (item) {
                this.levelSelected = item;
                this.contactPoint.levelId = item.id;
            }
        };
        this.navCtrl.push('/level-config', { callback, searchMode: true });
    }

    removeLevel(): void {
        this.levelSelected = null;
        this.contactPoint.levelId = 0;
    }
}
