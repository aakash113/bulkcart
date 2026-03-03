import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProblemSectionComponent } from './problem-section.component';

describe('ProblemSectionComponent', () => {
  let component: ProblemSectionComponent;
  let fixture: ComponentFixture<ProblemSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
