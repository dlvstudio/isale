import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'product-attribute-selector',
    templateUrl: 'product-attribute-selector.component.html'
})
export class ProductAttributeSelectorComponent {
    @Input() mainProduct: any;
    attributes: any[] = [];
    selectedAttributes: any[] = [];
    originalAttributes: any[] = [];
    searchKey = '';
    tab = 'all';
    currency: string;

    constructor(public navCtrl: RouteHelperService,
                private modalCtrl: ModalController,
                public translateService: TranslateService,
                private userService: UserService,
                public staffService: StaffService,
                private productService: ProductService,
                private analyticsService: AnalyticsService
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-attribute-selector');
    }

    reloadProducts = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.productService.getProductAttributes(this.mainProduct.id).then(async (attributes) => {
            const attributesPopulated = JSON.parse(JSON.stringify(attributes));
            if (attributesPopulated && attributesPopulated.length) {
                const selectedAttributes = [];
                for (const attribute of attributesPopulated) {
                    const optionPrevious = this.mainProduct.attributes && this.mainProduct.attributes.length
                        ? this.mainProduct.attributes.find((option) => option.id === attribute.id)
                        : null;
                    if (!optionPrevious) {
                        continue;
                    }
                    attribute.isSelected = true;
                    selectedAttributes.push(attribute);
                }
                this.selectedAttributes = selectedAttributes;
            }
            this.attributes = attributesPopulated;
            this.originalAttributes = attributesPopulated;
            await loading.dismiss();
        });
    }

    select(attribute) {
        attribute.isSelected = !attribute.isSelected;
        this.onChange(attribute, true);
    }

    onChange(attribute, fromSelect = false) {
        if (!attribute.isSelected) {
            this.analyticsService.logEvent('product-attribute-selector-deselected');
            const foundIndex = this.selectedAttributes.findIndex(item => item.id == attribute.id);
            if (foundIndex >= 0) {
                this.selectedAttributes.splice(foundIndex, 1);
            }
            if ((!this.selectedAttributes || !this.selectedAttributes.length)
                && (this.tab !== 'all')) {
                this.tab = 'all';
            }
        } else {
            const foundIndex = this.selectedAttributes.findIndex(item => item.id == attribute.id);
            if (foundIndex >= 0) {
                return;
            }
            this.analyticsService.logEvent('product-attribute-selector-selected');
            this.selectedAttributes.push(attribute);
        }
    }

    ngOnInit(): void {
        this.reloadProducts();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('product-attribute-selector-search');
        let attributes: any[] = this.originalAttributes;
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            attributes = attributes.filter((item) => {
                return (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.attributes = attributes;
    }

    async clearSearch() {
        this.analyticsService.logEvent('product-attribute-selector-clear-search');
        this.searchKey = null;
        this.attributes = this.originalAttributes;
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    async ok(): Promise<void> {
        this.analyticsService.logEvent('product-attribute-selector-ok');
        this.modalCtrl.dismiss(this.selectedAttributes);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }
}
