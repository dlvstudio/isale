/* eslint-disable no-eval */
/* eslint-disable @typescript-eslint/prefer-for-of */
import { Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { IonContent, ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { AnalyticsService } from '../../providers/analytics.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { DataService } from '../../providers/data.service';
import { snakeToPascalCase, snakeToKebabCase, kebabToCamel } from '../../providers/helper';

@Component({
    selector: 'list-only, [list-only]',
    templateUrl: 'list-only.component.html',
    styleUrls: ['list-only.component.scss']
})
export class ListOnlyComponent {
    @ViewChild('template', { static: true }) template;
    @ViewChild(IonContent, { static: false }) content: IonContent;
    @Input() presentItemActions = {};
    @Input() orderBy = '';
    @Input() orderOrient = 'asc';
    @Input() table = '';
    @Input() iconAdd = 'add';
    @Input() isQuickAdd = false;
    @Input() callable = false;
    @Input() segmentValues = [];
    @Input() itemTemplate = {};
    @Input() searchFields = [];
    @Input() defaultSegmentValue = '';
    @Input() canEditItem = false;
    @Input() filterObjects = {};
    @Input() actions = [];
    @Input() canDeleteItem = false;
    @Input() noDetail = false;
    @Input() deleteRelated;
    @Input() hideSearch = false;
    @Input() fetchObjectsFunc;
    @Output() scrollToTop = new EventEmitter();
    segmentValuesConverted = {};
    tableKebab = '';
    params: any = null;
    segmentValue = '';
    objects: any[];
    originalObjects: any[];
    searchKey = '';
    selectedStaff;
    isShowFilter = false;
    start = 0;
    pageSize = 20;
    end = 39;
    currentPage = 0;
    searchMode = false;
    callback;
    segmentValueKeys: string[];
    filterObjectKeys: string[];
    presentItemActionKeys: string[];

    constructor(
        public navCtrl: RouteHelperService,
        public staffService: StaffService,
        private alertCtrl: AlertController,
        private viewContainerRef: ViewContainerRef,
        private viewCtrl: ModalController,
        private translateService: TranslateService,
        private actionSheetCtrl: ActionSheetController,
        private dataService: DataService,
        private analyticsService: AnalyticsService
    ) {
    }

    functionMaps = {
        'not null and empty': '(item, field) => item[field] && item[field] !== ""',
        'fullname and code': '(item) => item.fullName + (item.code ? \' | \' + item.code : \'\')',
        'limit content': '(item) => this.limitText(item.content)',
        'note modified at': '(item) => this.dateFormat(item.modifiedAt)'
    }

    async reloadObjects(): Promise<void> {
        this.segmentValue = this.defaultSegmentValue;
        const loading = await this.navCtrl.loading();
        let objects = [];
        if (this.fetchObjectsFunc) {
            objects = await this.fetchObjectsFunc();
        } else {
            objects = await this.dataService.getObjects(this.table, this.selectedStaff ? this.selectedStaff.id : 0);
        }
        if (this.orderBy) {
            objects = _.orderBy(objects, [this.orderBy], [this.orderOrient]);
        }
        let filteredObjects = objects;
        for (const key in this.filterObjects) {
            if (this.filterObjects[key].value) {
                filteredObjects = filteredObjects.filter(c => c[kebabToCamel(key) + 'Id'] === this.filterObjects[key].value.id);
            }
        }
        this.originalObjects = JSON.parse(JSON.stringify(filteredObjects));
        this.objects = filteredObjects;
        await loading.dismiss();
        if (!this.objects || this.objects.length === 0) {
            this.segmentValue = 'all';
            return;
        }
        this.filter();
    }

    value(item, field) {
        const innerFields = field.split('.');
        if (innerFields && innerFields.length > 1) {
            let value = item;
            for (const innerField of innerFields) {
                value = value[kebabToCamel(innerField)];
                if (!value) {
                    return value;
                }
            }
            return value;
        }
        return item[kebabToCamel(field)];
    }

    func(valueFuncValue) {
        if (typeof valueFuncValue === 'function') {
            return valueFuncValue;
        }
        return eval(this.functionMaps[valueFuncValue]);
    }

    async ngOnInit(): Promise<void> {
        this.segmentValuesConverted = this.convertSegmentValues(this.segmentValues);
        const reloadList = (event) => {
            const data = event.detail;
            if (data && data.filter) {
                this.segmentValue = data.filter;
            }
            this.reloadObjects();
        };
        const reloadStr = 'reload' + snakeToPascalCase(this.table) + 'List';
        this.navCtrl.unsubscribe(reloadStr, reloadList);
        this.navCtrl.subscribe(reloadStr, reloadList);
        this.tableKebab = snakeToKebabCase(this.table);
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.searchMode) {
            this.searchMode = this.params.searchMode;
        }
        this.segmentValueKeys = Object.keys(this.segmentValuesConverted);
        this.filterObjectKeys = Object.keys(this.filterObjects);
        this.presentItemActionKeys = Object.keys(this.presentItemActions);
        await this.reloadObjects();

        this.viewContainerRef.createEmbeddedView(this.template);

    }

    call(object: any): void {
        this.saveLastActive(object, 'call');
        Helper.callPhone(object.mobile ? object.mobile : object.userName);
    }

    text(object: any): void {
        this.saveLastActive(object, 'text');
        Helper.sendSms(object.mobile ? object.mobile : object.userName);
    }

    saveLastActive(object: any, action: string): Promise<number> {
        object.lastActive = DateTimeService.toDbString();
        object.lastAction = action;
        return this.dataService.save(this.table, object).then((result) => {
            this.navCtrl.publish('reload' + snakeToPascalCase(this.table) + 'List');
            this.navCtrl.publish('reload' + snakeToPascalCase(this.table), object);
            return result;
        });
    }

    kebabToCamel(str) {
        return kebabToCamel(str);
    }

    filter(): void {
        if (!this.segmentValueKeys || !this.segmentValueKeys.length) {
            return;
        }
        this.start = 0;
        this.end = this.pageSize - 1;
        this.currentPage = 0;
        const objects: any[] = this.originalObjects && this.originalObjects.length
            ? JSON.parse(JSON.stringify(this.originalObjects))
            : [];
        this.objects = this.segmentValuesConverted[this.segmentValue] && this.segmentValuesConverted[this.segmentValue].filter
            ? this.segmentValuesConverted[this.segmentValue].filter(objects)
            : this.objects;
    }

    async select(object: any, $event): Promise<void> {
        $event.stopPropagation();
        if (this.searchMode) {
            if (this.callback) {
                this.callback(object);
                await this.navCtrl.back();
                return;
            }
            this.viewCtrl.dismiss(object);
            return;
        }
        if (!this.noDetail) {
            this.navCtrl.push('/' + this.tableKebab + '/detail', { id: object.id });
        } else {
            this.navCtrl.push('/' + this.tableKebab + '/add', { id: object.id });
        }
    }

    avatar(object: any): string {
        return Helper.contactImageOrPlaceholder(object.avatarUrl)
    }

    async callSearch(text) {
        this.searchKey = text;
        await this.search();
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent(this.table + '-search');
        let objects: any[] = JSON.parse(JSON.stringify(this.originalObjects));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            objects = objects.filter((item) => this.isMatch(searchKey, item));
        }
        this.objects = objects;
    }

    isMatch(searchKey, item) {
        if (!this.searchFields || !this.searchFields.length) {
            return false;
        }
        for (const field of this.searchFields) {
            if (field.indexOf('.') > 0) {
                const fields = field.split('.');
                let value = item;
                for (const f of fields) {
                    value = value ? value[f] : value;
                }
                if (value && Helper.stringSpecialContains(searchKey, value)) {
                    return true;
                }
                continue;
            }
            if (!item[field]) {
                continue;
            }
            if (Helper.stringSpecialContains(searchKey, item[field])) {
                return true;
            }
        }
        return false;

    }

    clearSearch() {
        this.searchKey = null;
        this.reloadObjects();
    }

    openAdd(): void {
        this.navCtrl.navigateForward('/' + this.tableKebab + '/' + (this.isQuickAdd ? 'quick-add' : 'add'), { fromSearch: this.searchMode });
    }

    async presentItemActionSheet(object: any) {
        const buttons = [];
        for (const objectActionKey of Object.keys(this.presentItemActions)) {
            buttons.push({
                text: this.translateService.instant(objectActionKey),
                handler: this.presentItemActions[objectActionKey][1].bind(this, object, this.objects, this.originalObjects)
            });
        }
        if (this.canDeleteItem) {
            buttons.push({
                text: this.translateService.instant(this.tableKebab + '.delete'),
                role: 'destructive',
                handler: this.delete.bind(this, object)
            });
        }
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons
        });
        actionSheet.present();
    }

    showFilter() {
        this.isShowFilter = !this.isShowFilter;
    }

    get isShowPaging() {
        if (this.objects && this.objects.length > this.pageSize) {
            return true;
        }
        return false;
    }

    previousPage() {
        if (this.currentPage <= 0) {
            this.currentPage = 0;
            return;
        }
        this.currentPage--;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        this.scrollToTop.emit();
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.objects.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        this.scrollToTop.emit();
    }

    async showSearchFilter(filterObjectKey) {
        this.analyticsService.logEvent(this.tableKebab + '-search-' + filterObjectKey);
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.filterObjects[filterObjectKey].value = staff;
                this.reloadObjects();
            }
        };
        this.navCtrl.push('/' + filterObjectKey, { callback, searchMode: true });
    }

    removeSearchFilter(filterObjectKey): void {
        this.filterObjects[filterObjectKey].value = null;
        this.reloadObjects();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }

    valueOf(item, fieldsInput) {
        if (!item) {
            return item;
        }
        const fields = fieldsInput.split('.');
        if (fields && fields.length) {
            let value = item;
            for (const field of fields) {
                value = value[kebabToCamel(field)];
                if (!value) {
                    return value;
                }
            }
            return value;
        }
        return null;
    }

    edit(object): void {
        this.navCtrl.navigateForward('/' + this.tableKebab + '/add', { fromSearch: this.searchMode, id: object.id });
    }

    async delete(object: any): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant(this.tableKebab + '.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.dataService.delete(this.table, object).then(async () => {
                            this.analyticsService.logEvent(this.tableKebab + '-delete-success');
                            let i = this.objects.findIndex(item => item.id == object.id);
                            if (i >= 0) {
                                this.objects.splice(i, 1);
                            }
                            i = this.originalObjects.findIndex(item => item.id == object.id);
                            if (i >= 0) {
                                this.originalObjects.splice(i, 1);
                            }
                            if (this.deleteRelated) { this.deleteRelated(object); }
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

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    convertSegmentValues(segmentValues: any[]) {
        const segmentValuesConverted = {};
        if (!segmentValues || !segmentValues.length) {
            return segmentValuesConverted
        }
        for (let i = 0; i < segmentValues.length; i++) {
            const segment = segmentValues[i];
            const segmentObject: any = {};
            const segmentName = segment[0];
            const queries = segment.slice(1);
            for (const query of queries) {
                if (query[0] === 'icon') {
                    segmentObject['icon'] = query[1];
                } else if (query[0] === 'filter') {
                    const filtersQuery = query.slice(1);
                    const filterFunction = (objectsInput) => {
                        let objects = objectsInput;
                        for (const filterQuery of filtersQuery) {
                            const filterCondition = filterQuery[0];
                            const filterValue = filterQuery[1];
                            if (filterValue === 'true' || filterValue === 'false') {
                                objects = objects.filter((item) => item[filterCondition] == (filterValue === 'true'));
                            } else if (filterValue === 'desc' || filterValue === 'asc') {
                                objects = _.orderBy(objects, [filterCondition], [filterValue]);
                            } else if (filterCondition === 'limit') {
                                objects = objects.slice(0, filterValue);
                            } else if (filterValue === 'not null and empty') {
                                objects = objects.filter((item) => this.func(filterValue)(item, filterCondition));
                            }
                            else {
                                objects = objects.filter((item) => item[filterCondition] === filterValue);
                            }
                        }
                        return objects;
                    };
                    segmentObject['filter'] = filterFunction;
                }
            }
            segmentValuesConverted[segmentName] = segmentObject;
        }
        return segmentValuesConverted;
    }
}
