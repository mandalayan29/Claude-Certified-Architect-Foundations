import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumeViewer } from './resume-viewer';

describe('ResumeViewer', () => {
  let component: ResumeViewer;
  let fixture: ComponentFixture<ResumeViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeViewer],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
