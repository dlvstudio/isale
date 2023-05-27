import { Component } from '@angular/core';

@Component({
    selector: 'shift',
    templateUrl: 'shift.component.html'
})
export class ShiftComponent {
    itemTemplate = {
        h2: {
            field: 'name'
        },
        pList: [
            {
                field: 'time',
                valueFunc: (item) => item.startTime + ' - ' + item.endTime
            }
        ]
    };

    searchFields = ['name'];

    constructor() {}
}
