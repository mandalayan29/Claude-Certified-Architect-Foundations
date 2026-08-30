import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumeJdForm } from './resume-jd-form';

describe('ResumeJdForm', () => {
  let component: ResumeJdForm;
  let fixture: ComponentFixture<ResumeJdForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeJdForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeJdForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
