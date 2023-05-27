import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';

@Component({
    selector: 'store',
    templateUrl: 'store.component.html'
})
export class StoreComponent {
    maxTopRecent = 50;
    presentItemActions = {
        'contact.new-note': ['/note/add', (item) => {
            this.navCtrl.navigateForward('/note/add', { contact: item.id });
        }],
        'contact.new-trade': ['/note/add', (item) => {
            this.navCtrl.navigateForward('/trade/add', { contact: item.id });
        }],
    };
    itemTemplate = {
        h2: {
            field: 'name'
        },
        pList: [
            {
                short: 'id'
            },
            {
                short: 'phone'
            },
            {
                short: 'email',
            },
            {
                short: 'address',
            },
            {
                short: 'facebook',
            },
            {
                short: 'bank-name',
            },
            {
                short: 'bank-account-name',
            },
            {
                short: 'bank-account-number',
            }
        ],
        thumbnail: 'icon-url'
    };

    searchFields = ['name', 'phone', 'email', 'address', 'facebook', 'bankName', 'bankAccountName', 'bankAccountNumber'];

    constructor(
        private navCtrl: RouteHelperService,
        ) {
    }
}
