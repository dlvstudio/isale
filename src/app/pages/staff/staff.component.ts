import { Component } from '@angular/core';

@Component({
    selector: 'staff',
    templateUrl: 'staff.component.html'
})
export class StaffComponent {
    itemTemplate = {
        h2: {
            field: 'name'
        },
        pList: [
            {
                field: 'userName'
            }, {
                short: 'store.name',
            }, {
                short: 'shift.name',
            }
        ]
    };

    searchFields = ['name', 'userName'];

    filterObjects = {
        store: {
            field: 'name'
        },
        shift: {
            field: 'name'
        }
    };

    actions = [
        {
            hidden: () => false,
            path: '/shift',
            icon: 'time',
            color: 'tertiary',
            title: 'shift.title',
        },
    ];
}