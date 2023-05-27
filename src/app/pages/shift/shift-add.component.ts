import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShiftService } from '../../providers/shift.service';
import { AlertController } from '@ionic/angular';

@Component({
    selector: 'shift-add',
    templateUrl: 'shift-add.component.html',
})
export class ShiftAddComponent {
    params: any = null;
    shift: any;
    date: string;
    isNew = true;
    fromSearch = false;

    constructor(public navCtrl: RouteHelperService,
                private alertController: AlertController,
                private shiftService: ShiftService,
                private translateService: TranslateService,
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
        await this.analyticsService.setCurrentScreen('shift-add');
    }

    async ngOnInit(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.shift = {};
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.isNew = false;
            this.shiftService.get(id).then(async (shift) => {
                this.shift = shift;
                await loading.dismiss();
            });
            return;
        }
        await loading.dismiss();
    }

    validate() {
        if (!this.shift.name) {
            alert(this.translateService.instant('shift-add.no-name-alert'));
            return false;
        }
        if (!this.shift.startTime) {
            alert(this.translateService.instant('shift-add.no-start-time-alert'));
            return false;
        }
        if (!this.shift.endTime) {
            alert(this.translateService.instant('shift-add.no-end-time-alert'));
            return false;
        }
        return true;
    }

    async save(): Promise<void> {
        if (!this.validate()) {
            return;
        }
        const loading = await this.navCtrl.loading();
        this.shiftService.save(this.shift).then(async () => {
            this.analyticsService.logEvent('shift-add-save-success');
            await loading.dismiss();
            this.exitPage();
        });
    }

    async exitPage() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
        this.navCtrl.publish('reloadShiftList');
        this.navCtrl.publish('reloadShift', this.shift);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    async delete(): Promise<void> {
        const confirm = await this.alertController.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('shift-add.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.shiftService.delete(this.shift).then(async () => {
                            this.analyticsService.logEvent('shift-detail-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadShiftList');
                        });
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }
}
