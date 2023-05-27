import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IonicModule } from "@ionic/angular";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { SharedModule, httpLoaderFactory } from "../shared/shared.module";
import { BusinessTypeAddComponent } from "./business-type-add.component";
import { BusinessTypeRoutingModule } from "./business-type-routing.module";
import { BusinessTypeComponent } from "./business-type.component";



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    FontAwesomeModule,
    BusinessTypeRoutingModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [BusinessTypeComponent,
    BusinessTypeAddComponent]
})
export class BusinessTypeModule { }
