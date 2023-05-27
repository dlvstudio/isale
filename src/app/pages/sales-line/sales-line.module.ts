import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IonicModule } from "@ionic/angular";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { SharedModule, httpLoaderFactory } from "../shared/shared.module";
import { SalesLineComponent } from "./sales-line.component";
import { SalesLineRoutingModule } from "./sales-line-routing.module";
import { SalesLineAddComponent } from "./sales-line-add.component";



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    FontAwesomeModule,
    SalesLineRoutingModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [SalesLineAddComponent,
    SalesLineComponent]
})
export class SalesLineModule { }
