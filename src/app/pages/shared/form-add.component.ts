/* eslint-disable no-eval */
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { camelToKebab, snakeToKebabCase, snakeToPascalCase, snakeToCamel } from '../../providers/helper';
import { DataService } from '../../providers/data.service';

@Component({
    selector: 'form-add, [form-add]',
    templateUrl: 'form-add.component.html',
    styleUrls: ['form-add.component.scss']
})
export class FormAddComponent {
    @ViewChild('template', { static: true }) template;
    @Input() table = '';
    @Input() fieldsList = [];
    @Input() validateFields = [];
    @Input() fieldInstructions = {};
    @Input() functionsMap = {}
    params: any = null;
    object: any = {};
    previousObject: any = {};
    fromSearch = false;
    saveDisabled = false;
    tableKebab;

    constructor(
        private viewContainerRef: ViewContainerRef,
        public navCtrl: RouteHelperService,
        private dataService: DataService,
        private analyticsService: AnalyticsService,
        private translateService: TranslateService,
    ) {
    }

    camelToKebab(str: string): string {
        return camelToKebab(str);
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
        await this.analyticsService.setCurrentScreen(this.tableKebab + '-add');
    }

    showDatePopup(field): void {
        this.object[field] = moment().startOf('day').format('YYYY-MM-DD');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.tableKebab = snakeToKebabCase(this.table);
        this.object = {};
        let objectId = 0;
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id) {
            objectId = this.params.id;
        }

        if (objectId && objectId > 0) {
            this.object = await this.dataService.get(this.table, objectId);
            for (const field of this.fieldsList) {
                if (this.fieldInstructions && this.fieldInstructions[field] && this.fieldInstructions[field].lookup) {
                    this.fieldInstructions[field].lookupObject = this.object[snakeToCamel(this.fieldInstructions[field].lookup)];
                }
            }
            this.previousObject = JSON.parse(JSON.stringify(this.object));
        }
        this.viewContainerRef.createEmbeddedView(this.template);
        await loading.dismiss();
    }

    showLookup(field) {
        const kebabField = snakeToKebabCase(this.fieldInstructions[field].lookup);
        this.analyticsService.logEvent(this.tableKebab + '-add-search-' + kebabField);
        const callback = (data) => {
            if (data) {
                this.fieldInstructions[field].lookupObject = data;
                this.object[field] = data.id;
                this.onChange(field);
            }
        };
        this.navCtrl.push('/' + kebabField, { callback, searchMode: true });
    }

    onChange(field) {
        if (this.fieldInstructions && this.fieldInstructions[field] && this.fieldInstructions[field].onchange) {
            if (typeof this.fieldInstructions[field].onchange === 'function') {
                this.fieldInstructions[field].onchange.bind(this)();
                return;
            }
            eval(this.functionsMap[this.fieldInstructions[field].onchange]).bind(this)();
        }
    }

    removeLookup(field): void {
        this.fieldInstructions[field].lookupObject = null;
        this.object[field] = 0;
        this.onChange(field);
    }

    removeDate(field): void {
        this.object[field] = '';
    }

    validate(): boolean {
        if (!this.object) {
            return false;
        }
        if (!this.validateFields || !this.validateFields.length) {
            return true;
        }
        for (const field of this.validateFields) {
            if (!this.object[field]) {
                alert(this.translateService.instant(this.tableKebab + '.no-' + camelToKebab(field) + '-alert'));
                return;
            }
        }
        return true;
    }

    async save(): Promise<void> {
        if (!this.validate()) {
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.dataService.save(this.table, this.object).then(async () => {
            this.analyticsService.logEvent(this.tableKebab + '-save-successfully');
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
        const tablePascal = snakeToPascalCase(this.table);
        this.navCtrl.publish('reload' + tablePascal + 'List', null);
        this.navCtrl.publish('reload' + tablePascal, this.object);
    }

    hasFieldInstruction(field, instruction): boolean {
        if (!this.fieldInstructions || !this.fieldInstructions[field] || !this.fieldInstructions[field][instruction]) {
            return false;
        }
        return true;
    }

    checkFieldInstruction(field, instruction, value): boolean {
        if (!this.fieldInstructions || !this.fieldInstructions[field] || !this.fieldInstructions[field][instruction]) {
            return false;
        }
        if (this.fieldInstructions[field][instruction] === value) {
            return true;
        }
        return false;
    }
}
