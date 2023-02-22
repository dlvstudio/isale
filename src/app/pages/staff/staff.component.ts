import { Component } from '@angular/core';
import { IStaff } from '../../models/staff.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController } from '@ionic/angular';
import { StaffService } from '../../providers/staff.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ShiftService } from '../../providers/shift.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'staff',
    templateUrl: 'staff.component.html'
})
export class StaffComponent {
    importantFilter = 'recent';
    staffs: IStaff[];
    shifts: any[] = [];
    stores: any[] = [];
    storeFilter = -1;
    shiftFilter = -1;
    originalStaffs: IStaff[];
    searchKey = '';

    constructor(public navCtrl: RouteHelperService,
                private translateService: TranslateService,
                private actionSheetCtrl: ActionSheetController,
                private staffService: StaffService,
                private storeService: StoreService,
                private shiftService: ShiftService,
                private analyticsService: AnalyticsService,
                ) {
        this.navCtrl.unsubscribe('reloadStaffList', this.reloadStaffs);
        this.navCtrl.subscribe('reloadStaffList', this.reloadStaffs);
    }

    async ionViewWillEnter() {
        this.shifts = await this.shiftService.getAll();
        this.stores = await this.storeService.getStores();
        await this.analyticsService.setCurrentScreen('staff');
    }

    reloadStaffs = async () => {
        const loading = await this.navCtrl.loading();
        this.staffService.getStaffs(this.storeFilter, this.shiftFilter).then(async (staffs) => {
            this.originalStaffs = JSON.parse(JSON.stringify(staffs));
            this.staffs = staffs;
            await loading.dismiss();
        });
    }

    ngOnInit(): void {
        this.reloadStaffs();
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(staff: IStaff): void {
        Helper.callPhone(staff.userName);
    }

    text(staff: IStaff): void {
        Helper.sendSms(staff.userName);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    openStaffAdd(): void {
        this.navCtrl.push('/staff/add');
    }

    selectStaff(id: number): void {
        this.navCtrl.push('/staff/detail', { id });
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
        this.analyticsService.logEvent('staff-search');
        let staffs: IStaff[] = JSON.parse(JSON.stringify(this.originalStaffs));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            staffs = staffs.filter((item) => (item.userName && item.userName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.name && item.name.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.staffs = staffs;
    }

    clearSearch() {
        this.searchKey = null;
        this.reloadStaffs();
    }

    async openStaffAddOptions(): Promise<void> {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('staff.create-new'),
                    handler: () => {
                        this.openStaffAdd();
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    searchShift() {
        const callback = async () => {};
        this.navCtrl.push('/staff/shift-search', { callback, fromStaff: true });
    }

    async resetFilter() {
        await this.reloadStaffs()
    }
}