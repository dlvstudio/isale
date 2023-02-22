import { Component } from '@angular/core';
import { IStaff } from '../../models/staff.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ModalController } from '@ionic/angular';
import { StaffService } from '../../providers/staff.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShiftService } from '../../providers/shift.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'search',
    templateUrl: 'search.component.html'
})
export class StaffSearchComponent {
    staffs: IStaff[];
    originalStaffs: IStaff[];
    searchKey = '';
    callback;
    params;
    shifts: any[] = [];
    stores: any[] = [];
    storeFilter = -1;
    shiftFilter = -1;

    constructor(public navCtrl: RouteHelperService,
                public viewCtrl: ModalController,
                private staffService: StaffService,
                private shiftService: ShiftService,
                private storeService: StoreService,
                private analyticsService: AnalyticsService,
                ) {
        this.navCtrl.unsubscribe('reloadStaffList', this.reloadStaffs);
        this.navCtrl.subscribe('reloadStaffList', this.reloadStaffs);
    }

    async ionViewWillEnter() {
        this.shifts = await this.shiftService.getAll();
        this.stores = await this.storeService.getStores();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.storeFilter) {
            this.storeFilter = this.params.storeFilter;
        }
        if (this.params && this.params.shiftFilter) {
            this.shiftFilter = this.params.shiftFilter;
        }
        await this.analyticsService.setCurrentScreen('staff-search');
    }

    reloadStaffs = async () => {
        const loading = await this.navCtrl.loading();
        this.staffService.getStaffs(this.storeFilter, this.shiftFilter).then(async (staffs) => {
            await loading.dismiss();
            this.originalStaffs = JSON.parse(JSON.stringify(staffs));
            this.staffs = staffs;
        });
    }

    ngOnInit(): void {
        this.reloadStaffs();
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    staffImageOrPlaceholder(staff: IStaff): string {
        return staff.avatarUrl !== null && staff.avatarUrl !== ''
            ? staff.avatarUrl
            : 'assets/person-placeholder.jpg';
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-staff-search');
        let staffs: IStaff[] = JSON.parse(JSON.stringify(this.originalStaffs));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            staffs = staffs.filter((item) => (item.name && item.name.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.userName && item.userName.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.staffs = staffs;
    }

    clearSearch() {
        this.searchKey = null;
        this.reloadStaffs();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }

    async selectStaff(staff: IStaff): Promise<void> {
        if (this.callback) {
            this.callback(staff);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss(staff);
    }

    openStaffAdd(): void {
        this.navCtrl.push('/staff/add', {fromSearch: true});
    }

    async resetFilter() {
        await this.reloadStaffs()
    }
}
