import { Component } from '@angular/core';

@Component({
    selector: 'business-type',
    templateUrl: 'business-type.component.html'
})
export class BusinessTypeComponent {
    itemTemplate = {
        h2: {
            field: 'title'
        }
    };

    searchFields = ['title'];

    constructor() {}
}
