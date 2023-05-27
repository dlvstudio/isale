import { Component } from '@angular/core';

@Component({
    selector: 'sales-line',
    templateUrl: 'sales-line.component.html'
})
export class SalesLineComponent {
    itemTemplate = {
        h2: {
            field: 'title'
        }
    };

    searchFields = ['title'];

    constructor() {}
}
