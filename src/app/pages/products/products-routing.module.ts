import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductsPage } from './products.page';
import { ProductDetailComponent } from './product-detail.component';
import { ProductAddComponent } from './product-add.component';
import { ProductImportComponent } from './product-import.component';
import { ProductNoteExportComponent } from './product-note-export.component';
import { ProductQuickAddComponent } from './product-quick-add.component';
import { ProductAttributeComponent } from './product-attribute.component';
import { ProductAttributeAddComponent } from './product-attribute-add.component';
import { ProductsExpiryComponent } from './products-expiry.component';
import { ProductTypeComponent } from './product-type.component';
import { ProductTypeAddComponent } from './product-type-add.component';
import { ProductTypeValueAddComponent } from './product-type-value-add.component';
import { ProductTypeSelectorComponent } from './product-type-selector.component';
import { ProductBarcodeAddComponent } from './product-barcode-add.component';
import { ProductBarcodeComponent } from './product-barcode.component';
import { MaterialComponent } from './material.component';

const routes: Routes = [
  {
    path: '',
    component: ProductsPage
  },
  {
    path: 'detail',
    component: ProductDetailComponent
  },
  {
    path: 'edit',
    component: ProductAddComponent
  },
  {
    path: 'quick-add',
    component: ProductQuickAddComponent
  },
  {
    path: 'import',
    component: ProductImportComponent
  },
  {
    path: 'export',
    component: ProductNoteExportComponent
  },
  {
    path: 'attribute',
    component: ProductAttributeComponent
  },
  {
    path: 'type',
    component: ProductTypeComponent
  },
  {
    path: 'add-attribute',
    component: ProductAttributeAddComponent
  },
  {
    path: 'add-type',
    component: ProductTypeAddComponent
  },
  {
    path: 'add-type-value',
    component: ProductTypeValueAddComponent
  },
  {
    path: 'type-selector',
    component: ProductTypeSelectorComponent
  },
  {
    path: 'expiries',
    component: ProductsExpiryComponent
  },
  {
    path: 'add-barcode',
    component: ProductBarcodeAddComponent
  },
  {
    path: 'barcode',
    component: ProductBarcodeComponent
  },
  {
    path: 'material',
    component: MaterialComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsPageRoutingModule {}
