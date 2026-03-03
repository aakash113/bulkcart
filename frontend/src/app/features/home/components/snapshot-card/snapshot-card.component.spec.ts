import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotCardComponent } from './snapshot-card.component';

describe('SnapshotCardComponent', () => {
  let component: SnapshotCardComponent;
  let fixture: ComponentFixture<SnapshotCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnapshotCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
