import { Component, ViewChild } from '@angular/core';
import { TradeService } from '../../providers/trade.service';
import { StaffService } from '../../providers/staff.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ListComponent } from '../shared/list.component';

@Component({
    selector: 'category',
    templateUrl: 'category.component.html'
})
export class CategoryComponent {
    @ViewChild(ListComponent, { static: false }) listComponent: ListComponent;

    up = async (i, object, objects) => {
        const loading = await this.navCtrl.loading();
        const arr = [];
        objects[i].orderIndex = i - 1;
        arr.push(this.tradeService.saveCategory(objects[i]));
        objects[i - 1].orderIndex = i;
        arr.push(this.tradeService.saveCategory(objects[i - 1]));
        for (let id = i + 1; id < objects.length; id++) {
            objects[id].orderIndex = id;
            arr.push(this.tradeService.saveCategory(objects[id]));
        }
        await Promise.all(arr);
        await this.listComponent.callReload();
        await loading.dismiss();
    }

    down = async (i, object, objects) => {
        const loading = await this.navCtrl.loading();
        const arr = [];
        objects[i].orderIndex = i + 1;
        arr.push(this.tradeService.saveCategory(objects[i]));
        objects[i + 1].orderIndex = i;
        arr.push(this.tradeService.saveCategory(objects[i + 1]));
        for (let id = i + 2; id < objects.length; id++) {
            objects[id].orderIndex = id;
            arr.push(this.tradeService.saveCategory(objects[id]));
        }
        await Promise.all(arr);
        await this.listComponent.callReload();
        await loading.dismiss();
    }

    itemTemplate = {
        h2: {
            field: 'title'
        },
        reorderButtons: {
            upFunc: this.up,
            downFunc: this.down
        }
    };

    searchFields = ['title'];

    constructor(
        private tradeService: TradeService,
        public staffService: StaffService,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('category');
    }

    ngOnInit(): void {
        // this.reload();
    }

    addReport(): void {
        this.navCtrl.push('/category-report/add', null)
    }
}
