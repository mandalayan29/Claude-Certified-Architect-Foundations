import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type ResumeLayout = 'layout1' | 'layout2' | 'layout3';

export interface ParsedSection {
  id: string;
  rawHeading: string;
  title: string;
  content: string;
  isEditing: boolean;
  aiPrompt: string;
  isAiLoading: boolean;
}

@Component({
  imports: [CommonModule, FormsModule],
  standalone: true,
  selector: 'app-resume-viewer',
  styleUrl: './resume-viewer.css',
  templateUrl: './resume-viewer.html',
})
export class ResumeViewer {
// Single source of truth: Master Markdown Resume
  rawResumeMarkdown = signal<string>(`# Jordan Taylor
**Email:** jordan.taylor@example.com | **Phone:** (555) 234-5678 | **Location:** Seattle, WA
**LinkedIn:** linkedin.com/in/jordantaylor | **GitHub:** github.com/jordantaylor

## Professional Summary
Results-driven Senior Backend Engineer with 4+ years of experience engineering high-throughput microservices and distributed APIs using Python and FastAPI. Proven track record in optimizing PostgreSQL query execution by 42%, automating Docker/Kubernetes CI/CD pipelines, and ensuring 99.98% platform uptime.

## Technical Skills
- **Languages:** Python, SQL, Bash, Go (Foundational)
- **Frameworks & APIs:** FastAPI, Django, Flask, RESTful APIs, gRPC
- **Databases & Optimization:** PostgreSQL, Redis, Query Optimization, Database Indexing
- **Cloud & DevOps:** Docker, Kubernetes, AWS (EC2, S3, RDS), GitHub Actions, CI/CD, Linux

## Work Experience
### Senior Backend Developer — CloudSync
*2022 – Present | Seattle, WA*
- Architected and deployed high-throughput backend API endpoints using **FastAPI** and **Python**, decreasing 95th-percentile response latency by **38%**.
- Resolved critical database bottlenecks in **PostgreSQL** by redesigning indexing strategies and query plans, accelerating transaction throughput for 200k+ daily users.
- Engineered automated **Docker** build and deployment pipelines in GitHub Actions, slashing release deployment cycles from 45 minutes to 8 minutes.

### Software Engineer — NextGen Apps
*2021 – 2022 | Austin, TX*
- Designed and implemented microservices using **Django** and **REST APIs**, maintaining 99.9% service availability across 12 production nodes.
- Wrote comprehensive unit and integration test suites with PyTest, lifting automated test coverage from 64% to 91%.

## Education
### B.S. in Computer Science
*University of Washington | Graduated 2021*

## Projects & Highlights
- **Distributed Microservices Gateway:** Built an asynchronous reverse-proxy in FastAPI handling 15,000 requests/sec with Redis caching.
- **Automated Database Health Checker:** Developed a Python CLI tool to detect unindexed foreign keys and slow queries in PostgreSQL.`);

  // Active layout selector
  activeLayout = signal<ResumeLayout>('layout1');

  // Metrics
  atsScore = signal<number>(95);
  jobMatch = signal<number>(91);
  isSaving = signal<boolean>(false);

  // Store the original state for reset
  private initialMarkdown = this.rawResumeMarkdown();

  // Parse master markdown into dynamic sections
  sections = computed<ParsedSection[]>(() => {
    const raw = this.rawResumeMarkdown();
    const parts = raw.split(/(?=\n## |\n# )/g);

    return parts.map((part, index) => {
      const trimmed = part.trim();
      const firstLineEnd = trimmed.indexOf('\n');
      const headerLine = firstLineEnd === -1 ? trimmed : trimmed.substring(0, firstLineEnd);
      const content = firstLineEnd === -1 ? '' : trimmed.substring(firstLineEnd + 1).trim();

      const title = headerLine.replace(/^#+\s*/, '').trim() || `Section ${index + 1}`;
      const id = `sec_${index}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      return {
        id,
        rawHeading: headerLine,
        title,
        content: content || headerLine, // fallback if single-line
        isEditing: false,
        aiPrompt: '',
        isAiLoading: false
      };
    });
  });

  // Layout switcher
  setLayout(layout: ResumeLayout) {
    this.activeLayout.set(layout);
  }

  // Markdown-to-HTML converter
  renderMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold tracking-tight text-slate-900 mb-1">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-sm font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-1 mt-3 mb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xs font-bold text-slate-900 mt-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="text-slate-600 text-xs">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 text-xs leading-relaxed">$1</li>')
      .replace(/\n\n/gim, '<div class="h-2"></div>')
      .replace(/\n/gim, '<br/>');
  }

  // Section Editing Management
  toggleEdit(section: ParsedSection) {
    section.isEditing = !section.isEditing;
  }

  saveSection(section: ParsedSection) {
    section.isEditing = false;
    this.reconstructMasterMarkdown();
  }

  triggerAiEdit(section: ParsedSection) {
    if (!section.aiPrompt.trim()) return;

    section.isAiLoading = true;
    setTimeout(() => {
      section.content = `${section.content}\n- **[AI Refined]** Quantified achievement aligned with: "${section.aiPrompt}"`;
      section.aiPrompt = '';
      section.isAiLoading = false;
      section.isEditing = false;

      this.reconstructMasterMarkdown();
      this.atsScore.update(s => Math.min(100, s + 1));
    }, 1200);
  }

  // Rebuild the master raw markdown variable when individual sections change
  private reconstructMasterMarkdown() {
    const updated = this.sections()
      .map(s => (s.rawHeading.startsWith('#') ? `${s.rawHeading}\n${s.content}` : s.content))
      .join('\n\n');
    this.rawResumeMarkdown.set(updated);
  }

  // Header & Body categorization helpers for Layout 2 (Two-Column)
  isSidebarSection(section: ParsedSection): boolean {
    const title = section.title.toLowerCase();
    return title.includes('skill') || title.includes('education') || title.includes('contact');
  }

  exportPdf() {
    window.print();
  }

  exportDocx() {
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      alert('Exported resume as Word (.docx) matching active layout!');
    }, 1000);
  }

  resetResume() {
    if (confirm('Reset resume to initial markdown?')) {
      this.rawResumeMarkdown.set(this.initialMarkdown);
      this.atsScore.set(95);
    }
  }
}