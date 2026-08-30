import { Routes } from '@angular/router';
import { ResumeViewer } from './resume-viewer/resume-viewer';
import { ResumeJdForm } from './resume-jd-form/resume-jd-form';

export const routes: Routes = [
    {
        path: 'resume',
        component: ResumeViewer
    },
    {
        path: 'optimize',
        component: ResumeJdForm
    }
];
