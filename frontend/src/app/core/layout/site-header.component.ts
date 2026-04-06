import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.css'],
})
export class SiteHeaderComponent {
  @Input() mode: 'public' | 'private' = 'public';

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly user = computed(() => this.auth.user());

  protected navigateToPrimaryFlow(destination: 'login' | 'signup' | 'catalog') {
    if (destination === 'catalog' && this.user()) {
      this.router.navigateByUrl('/catalog');
      return;
    }

    this.router.navigateByUrl(`/${destination}`);
  }
}
