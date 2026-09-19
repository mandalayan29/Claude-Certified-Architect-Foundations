(async function scrapeSectionTranscripts() {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Locate Section 25
  const section = document.querySelector('[data-purpose="section-panel-24"]');
  if (!section) {
    console.error('Section 25 panel not found!');
    return;
  }

  // 2. Filter out non-video items (quizzes, roleplays)
  const items = Array.from(
    section.querySelectorAll('li.curriculum-item-link--curriculum-item--OVP5S')
  ).filter((el) => !!el.querySelector('use[*|href="#icon-video"]'));

  console.log(`Found ${items.length} video lectures in Section 25. Starting extraction...`);

  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const titleEl = item.querySelector('[data-purpose="item-title"]');
    const title = titleEl ? titleEl.innerText.trim() : `Lecture ${i + 1}`;
    console.log(`[${i + 1}/${items.length}] Processing: "${title}"`);

    // Click to navigate to the lecture
    const clickable = item.querySelector('[role="link"], .item-link, button') || item;
    clickable.click();
    await sleep(3500); // Wait for video and player controls to initialize

    // Ensure Transcript panel is active
    const transcriptBtn = document.querySelector('button[data-purpose="transcript-toggle"]');
    if (transcriptBtn && transcriptBtn.getAttribute('aria-expanded') !== 'true') {
      transcriptBtn.click();
      await sleep(1500);
    }

    // Extract transcript cues
    let transcriptText = '';
    const cueSelector = '[data-purpose="transcript-cue-text"], .transcript--cue-text--q5Yq4, [class*="transcript--cue-text"]';
    let cueElements = document.querySelectorAll(cueSelector);

    // If slow to mount, retry once after a short wait
    if (cueElements.length === 0) {
      await sleep(2000);
      cueElements = document.querySelectorAll(cueSelector);
    }

    if (cueElements.length > 0) {
      transcriptText = Array.from(cueElements)
        .map((cue) => cue.innerText.trim())
        .filter(Boolean)
        .join(' ');
      console.log(`✓ Transcript collected (${transcriptText.length} chars)`);
    } else {
      console.warn(`⚠ No transcript found or captions unavailable for: "${title}"`);
    }

    results.push({
      index: i + 1,
      title: title,
      transcript: transcriptText
    });

    // Short buffer before next click
    await sleep(1000);
  }

  // 3. Format and copy to clipboard
  const finalJson = JSON.stringify(results, null, 2);

  if (typeof copy === 'function') {
    copy(finalJson);
    console.log('Finished! All transcripts copied to clipboard via DevTools copy().');
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = finalJson;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    console.log('Finished! Copied to clipboard via fallback.');
  }

  console.log(results);
})();




---------------------


(async function fetchSectionTranscriptsDirectly() {
  const COURSE_ID = 2167814;
  const sectionPanel = document.querySelector('[data-purpose="section-panel-24"]');
  
  if (!sectionPanel) {
    console.error('Section 25 panel not found!');
    return;
  }

  // Find all video items in Section 25
  const itemEls = Array.from(sectionPanel.querySelectorAll('li.curriculum-item-link--curriculum-item--OVP5S'))
    .filter(el => !!el.querySelector('use[*|href="#icon-video"]'));

  console.log(`Extracting IDs for ${itemEls.length} video lectures...`);

  const lectures = [];
  itemEls.forEach((el, index) => {
    const titleEl = el.querySelector('[data-purpose="item-title"]');
    const completionEl = el.querySelector('[id^="item-completion-state-"]');
    const lectureId = completionEl ? completionEl.id.replace('item-completion-state-', '') : null;

    if (titleEl && lectureId) {
      lectures.push({
        index: index + 1,
        id: lectureId,
        title: titleEl.innerText.trim()
      });
    }
  });

  console.log(`Found ${lectures.length} target lecture IDs. Fetching transcripts...`);
  const results = [];

  for (let i = 0; i < lectures.length; i++) {
    const lec = lectures[i];
    console.log(`[${i + 1}/${lectures.length}] Fetching transcript: "${lec.title}"`);

    let transcriptText = '';

    try {
      // 1. Query lecture asset metadata (contains caption URLs)
      const lecRes = await fetch(
        `/api-2.0/users/me/subscribed-courses/${COURSE_ID}/lectures/${lec.id}/?fields[lecture]=asset,title&fields[asset]=captions`,
        { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
      );

      if (!lecRes.ok) {
        console.warn(`Could not load details for lecture ${lec.id}: HTTP ${lecRes.status}`);
      } else {
        const lecData = await lecRes.json();
        const captions = lecData?.asset?.captions || [];

        // Prefer English, then English [Auto], or fallback to the first track
        const enTrack = captions.find(c => c.locale_id === 'en_US') 
                     || captions.find(c => c.locale_id?.startsWith('en')) 
                     || captions[0];

        if (enTrack?.url) {
          // 2. Fetch the WebVTT / SRT caption text
          const vttRes = await fetch(enTrack.url);
          const vttRaw = await vttRes.text();

          // 3. Parse WebVTT/SRT: remove timestamps, headers, metadata, and merge lines
          transcriptText = vttRaw
            .replace(/WEBVTT[\s\S]*?\n\n/, '') // remove WebVTT header
            .replace(/\d+\r?\n\d\d:\d\d[\s\S]*?-->[\s\S]*?\r?\n/g, '') // remove line counters & timestamps
            .replace(/<[^>]+>/g, '') // remove HTML styling tags like <v ...> or <i>
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.includes('-->'))
            .join(' ')
            .replace(/\s+/g, ' '); // collapse multi-spaces

          // Preview first 100 characters
          const preview = transcriptText.slice(0, 100);
          console.log(`✓ Retrieved (${transcriptText.length} chars)`);
          console.log(`  Preview: "${preview}${transcriptText.length > 100 ? '...' : ''}"`);
        } else {
          console.warn(`⚠ No captions found for "${lec.title}"`);
        }
      }
    } catch (err) {
      console.error(`Error processing ${lec.title}:`, err);
    }

    results.push({
      index: lec.index,
      id: lec.id,
      title: lec.title,
      transcript: transcriptText
    });

    // Small polite delay between API calls
    await new Promise(r => setTimeout(r, 250));
  }

  const jsonOutput = JSON.stringify(results, null, 2);

  if (typeof copy === 'function') {
    copy(jsonOutput);
    console.log(`Finished! Successfully extracted all transcripts to clipboard.`);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = jsonOutput;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    console.log('Finished! Copied to clipboard via fallback.');
  }

  console.log(results);
})();