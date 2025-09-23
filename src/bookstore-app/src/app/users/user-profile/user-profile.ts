import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Role } from '../../models/role.model';

interface UserProfile {
  username: string;
  nickname: string;
  roles: Role[];
}

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    RouterModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;

  constructor(
    private jwtHelper: JwtHelperService
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // const token = this.authService.getToken();
    // if (token) {
    //   const decoded: JwtPayload | null = this.jwtHelper.decodeToken(token);
    //   if (decoded) {
    //     this.userProfile = {
    //       username: decoded.username,
    //       nickname: decoded.nickname,
    //       roles: decoded.roles || []
    //     };
    //   }
    // }
  }

  logout(): void {
    //this.authService.logout();
  }
}