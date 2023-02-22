import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContactComponent } from './contact.component';
import { ContactAddComponent } from './contact-add.component';
import { ContactDetailComponent } from './contact-detail.component';
import { ContactImportComponent } from './contact-import.component';
import { ContactQuickAddComponent } from './contact-quick-add.component';
import { ContactSearchComponent } from './search.component';
import { CustomerPriceAddComponent } from '../customer-price/customer-price-add.component';
import { CustomerDiscountAddComponent } from '../customer-discount/customer-discount-add.component';
import { SearchSalesLineComponent } from './search-sales-line.component';
import { SalesLineAddComponent } from './sales-line-add.component';
import { SearchBusinessTypeComponent } from './search-business-type.component';
import { BusinessTypeAddComponent } from './business-type-add.component';
import { EditPointComponent } from './edit-point.component';
import { ContactMobileImportComponent } from './contact-mobile-import.component';


const routes: Routes = [
  {
    path: '',
    component: ContactComponent
  },
  {
    path: 'add',
    component: ContactAddComponent
  },
  {
    path: 'quick-add',
    component: ContactQuickAddComponent
  },
  {
    path: 'detail',
    component: ContactDetailComponent
  },
  {
    path: 'import',
    component: ContactImportComponent
  },
  {
    path: 'search',
    component: ContactSearchComponent
  },
  {
    path: 'search-sales-line',
    component: SearchSalesLineComponent
  },
  {
    path: 'add-sales-line',
    component: SalesLineAddComponent,
  },
  {
    path: 'search-business-type',
    component: SearchBusinessTypeComponent
  },
  {
    path: 'add-business-type',
    component: BusinessTypeAddComponent,
  },
  {
    path: 'add-price',
    component: CustomerPriceAddComponent
  },
  {
    path: 'add-discount',
    component: CustomerDiscountAddComponent
  },
  {
    path: 'edit-point',
    component: EditPointComponent
  },
  {
    path: 'mobile-import',
    component: ContactMobileImportComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContactRoutingModule {}
