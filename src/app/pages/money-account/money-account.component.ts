import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';

@Component({
    selector: 'money-account',
    templateUrl: 'money-account.component.html'
})
export class MoneyAccountComponent {
    currency;
    itemTemplate = {
        h2: {
            field: 'account-name'
        },
        pList: [
            {
                field: 'total',
                valueFunc: (item) => this.currencyPipe.transform(item.total, this.currency, 'symbol', '1.0-2', this.translateService.currentLang),
            },
            {
                field: 'bank-name'
            },
            {
                field: 'bank-account-name'
            },
            {
                field: 'bank-number'
            },
        ]
    };

    searchFields = ['accountName', 'bankName', 'bankAccountName', 'bankNumber'];

    constructor(
        private currencyPipe: CurrencyPipe,
        private translateService: TranslateService,
        private userService: UserService
    ) {}

    async ngOnInit() {
        this.currency = await this.userService.getAttr('current-currency');
    }
}
