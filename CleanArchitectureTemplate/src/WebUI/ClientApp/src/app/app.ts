import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavMenuComponent } from './nav-menu/nav-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavMenuComponent],
  templateUrl: './app.html'
})
export class App {}
