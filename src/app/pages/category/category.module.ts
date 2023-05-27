import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CategoryRoutingModule } from './category-routing.module';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { httpLoaderFactory, SharedModule } from '../shared/shared.module';
import { CategoryComponent } from './category.component';
import { CategoryAddComponent } from './category-add.component';
import { CategoryDetailComponent } from './category-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CategoryRoutingModule,
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  entryComponents: [],
  declarations: [CategoryComponent, CategoryAddComponent, CategoryDetailComponent]
})
export class CategoryModule {}
