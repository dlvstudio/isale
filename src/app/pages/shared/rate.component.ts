import { Component } from '@angular/core';
import { AnalyticsService } from '../../providers/analytics.service';
import { RouteHelperService } from '../../providers/route-helper.service';
declare let AppRate;

@Component({
    selector: 'rate',
    templateUrl: 'rate.component.html'
})
export class RateComponent {

    constructor(public navCtrl: RouteHelperService,
                private analyticsService: AnalyticsService) {
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
    }

    rate(): void {
        this.analyticsService.logEvent('rate');
        if (typeof AppRate === 'undefined') {
            return;
        }
        AppRate.promptForRating(true);
    }
}
