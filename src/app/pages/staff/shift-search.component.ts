import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ModalController } from '@ionic/angular';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShiftService } from '../../providers/shift.service';

@Component({
    selector: 'shift-search',
    templateUrl: 'shift-search.component.html'
})
export class ShiftSearchComponent {
    shifts: any[];
    originalShifts: any[];
    searchKey = '';
    callback;
    params;
    fromStaff = false;

    constructor(public navCtrl: RouteHelperService,
        public viewCtrl: ModalController,
        private shiftService: ShiftService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadShiftList', this.reloadShifts);
        this.navCtrl.subscribe('reloadShiftList', this.reloadShifts);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('shift-search');
    }

    reloadShifts = async () => {
        const loading = await this.navCtrl.loading();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.fromStaff) {
            this.fromStaff = this.params.fromStaff;
        }

        this.shiftService.getAll().then(async (shifts) => {
            await loading.dismiss();
            this.originalShifts = JSON.parse(JSON.stringify(shifts));
            this.shifts = shifts;
        });
    }

    ngOnInit(): void {
        this.reloadShifts();
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('shift-search');
        let shifts: any[] = JSON.parse(JSON.stringify(this.originalShifts));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            shifts = shifts.filter((item) => (item.name && item.name.toLowerCase().indexOf(searchKey) !== -1)
                || (item.userName && item.userName.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.shifts = shifts;
    }

    clearSearch() {
        this.searchKey = null;
        this.reloadShifts();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.popOnly();
            return;
        }
        this.viewCtrl.dismiss();
    }

    async selectShift(shift: any): Promise<void> {
        if (this.fromStaff) {
            this.navCtrl.push('/staff/shift-add', {id: shift.id});
            return;
        }
        if (this.callback) {
            this.callback(shift);
            await this.navCtrl.popOnly();
            return;
        }
        this.viewCtrl.dismiss(shift);
    }

    openShiftAdd(): void {
        this.navCtrl.push('/staff/shift-add');
    }
}
