import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { IonContent, ModalController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { snakeToKebabCase } from '../../providers/helper';
import { ListOnlyComponent } from './list-only.component';

@Component({
    selector: 'list, [list]',
    templateUrl: 'list.component.html'
})
export class ListComponent {
    @ViewChild('template', { static: true }) template;
    @ViewChild(IonContent, { static: false }) content: IonContent;
    @ViewChild(ListOnlyComponent, { static: false }) listOnlyComponent: ListOnlyComponent;
    @Input() presentItemActions = {};
    @Input() table = '';
    @Input() orderBy = '';
    @Input() orderOrient = 'asc';
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
    @Input() backOnly = false;
    @Input() fetchObjectsFunc;
    tableKebab = '';
    params;
    searchMode = false;
    callback;

    constructor(
        public navCtrl: RouteHelperService,
        public staffService: StaffService,
        private viewContainerRef: ViewContainerRef,
        private analyticsService: AnalyticsService,
        private viewCtrl: ModalController
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen(this.table);
    }

    ngOnInit() {
        this.tableKebab = snakeToKebabCase(this.table);
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.searchMode) {
            this.searchMode = this.params.searchMode;
        }
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.viewContainerRef.createEmbeddedView(this.template);
    }

    openAdd(): void {
        this.navCtrl.navigateForward('/' + this.tableKebab + '/' + (this.isQuickAdd ? 'quick-add' : 'add'), { fromSearch: this.searchMode });
    }

    scrollToTop() {
        this.content.scrollToTop();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }

    async callReload() {
        await this.listOnlyComponent.reloadObjects();
    }
}
