import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { RouterModule } from "@angular/router";
import { Menu } from "../../models/menu.model";


@Component({
    selector: 'recursive-menu',
    standalone: true,
    templateUrl: './recursive-menu.html',
    styleUrls: ['./recursive-menu.scss'],
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatListModule,
    ],
})
export class RecursiveMenu {
    @Input({ required: true }) menu!: Menu;
    @Input() level: number = 0;

    isExpanded: boolean = false;


    toggleChildren(): void {
        if (this.hasChildren) {
            this.isExpanded = !this.isExpanded;
        }
    }

    get hasChildren(): boolean {
        return !!this.menu.children && this.menu.children.length > 0;
    }
}