(function () {
  function firstNonEmpty(...values) {
    for (const value of values) {
      const text = cleanText(value);
      if (text) {
        return text;
      }
    }
    return '';
  }

  function textFromNode(node) {
    return cleanText(node ? node.textContent : '');
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function firstText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = textFromNode(node);
      if (text) {
        return text;
      }
    }
    return '';
  }

  function firstMainText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = textFromNode(node);
      if (text && text.length > 80) {
        return text;
      }
    }
    return '';
  }

  function collectTexts(selectors) {
    const seen = new Set();
    const results = [];

    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        const text = textFromNode(node);
        if (!text || seen.has(text)) {
          continue;
        }
        seen.add(text);
        results.push(text);
      }
    }

    return results;
  }

  function detectSourceSite(hostname) {
    if (hostname.includes('104.com.tw')) {
      return '104';
    }
    if (hostname.includes('cakeresume.com')) {
      return 'cakeresume';
    }
    return hostname.replace(/^www\./, '') || 'unknown';
  }

  function toArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }

  function tryParseJson(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function pickJobPostingNode(node) {
    if (!node || typeof node !== 'object') {
      return null;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const match = pickJobPostingNode(item);
        if (match) {
          return match;
        }
      }
      return null;
    }

    const typeValues = toArray(node['@type']).map((item) => String(item).toLowerCase());
    if (typeValues.includes('jobposting')) {
      return node;
    }

    if (Array.isArray(node['@graph'])) {
      return pickJobPostingNode(node['@graph']);
    }

    return null;
  }

  function readJobPostingData() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      const parsed = tryParseJson(script.textContent);
      const jobPosting = pickJobPostingNode(parsed);
      if (!jobPosting) {
        continue;
      }

      const hiringOrganization = jobPosting.hiringOrganization || {};
      const baseSalary = jobPosting.baseSalary || {};
      const salaryValue = baseSalary.value || {};
      const rawLocations = toArray(jobPosting.jobLocation);
      const formattedLocations = rawLocations
        .map((location) => {
          const address = location && location.address ? location.address : {};
          return [
            address.addressRegion,
            address.addressLocality,
            address.streetAddress,
          ].map(cleanText).filter(Boolean).join(' ');
        })
        .filter(Boolean);

      const salaryText = firstNonEmpty(
        baseSalary.currency && salaryValue.value
          ? `${baseSalary.currency} ${salaryValue.value}`
          : '',
        salaryValue.minValue && salaryValue.maxValue
          ? `${salaryValue.minValue} - ${salaryValue.maxValue}`
          : '',
        salaryValue.minValue,
        salaryValue.maxValue,
        salaryValue.value
      );

      return {
        source_site: detectSourceSite(location.hostname),
        job_url: firstNonEmpty(jobPosting.url, location.href),
        job_title: firstNonEmpty(jobPosting.title),
        company: firstNonEmpty(hiringOrganization.name),
        industry: firstNonEmpty(
          Array.isArray(jobPosting.industry) ? jobPosting.industry.join(' / ') : jobPosting.industry
        ),
        location: formattedLocations.join(' / '),
        salary_text: salaryText,
        jd_text: firstNonEmpty(jobPosting.description),
      };
    }

    return null;
  }

  function extract104() {
    const structured = readJobPostingData() || {};

    return {
      source_site: '104',
      job_url: location.href,
      job_title: firstNonEmpty(
        firstText(['h1', '.job-header__title', '.apply-job__title']),
        structured.job_title,
        cleanText(document.title)
      ),
      company: firstNonEmpty(
        firstText(['.job-header__company', '.apply-job__company', 'a[href*="/company/"]']),
        structured.company
      ),
      industry: firstNonEmpty(
        firstText([
          '.job-detail-tag a',
          '[data-qa-id="job-industry"]',
          '[class*="industry"]'
        ]),
        structured.industry
      ),
      location: firstNonEmpty(
        firstText([
          '[data-qa-id="job-location"]',
          '.job-detail-job-condition a[href*="maps"]',
          '[class*="job-address"]',
          '[class*="address"]'
        ]),
        structured.location
      ),
      salary_text: firstNonEmpty(
        firstText([
          '[data-qa-id="job-salary"]',
          '.job-detail-job-condition [class*="salary"]',
          '[class*="job-reward"]',
          '[class*="salary"]'
        ]),
        structured.salary_text
      ),
      jd_text: firstNonEmpty(
        firstMainText(['.job-description', '.job-detail-box', '.job-content', 'main']),
        structured.jd_text,
        cleanText(document.body.innerText)
      ),
    };
  }

  function extractCakeResume() {
    const structured = readJobPostingData() || {};
    const cakeIndustry = collectTexts([
      '[data-testid="job-category"]',
      '[data-testid="job-categories"] a',
      '[data-testid="job-industries"] a',
      'a[href*="profession"]',
      'a[href*="industry"]',
      'a[href*="/job-search"]',
      'a[href*="/jobs?"]',
    ]).join(' / ');

    return {
      source_site: 'cakeresume',
      job_url: location.href,
      job_title: firstNonEmpty(
        firstText(['h1', '[data-testid="job-title"]']),
        structured.job_title,
        cleanText(document.title)
      ),
      company: firstNonEmpty(
        firstText(['a[href*="/companies/"]', '[data-testid="company-name"]']),
        structured.company
      ),
      industry: firstNonEmpty(
        structured.industry,
        cakeIndustry
      ),
      location: firstNonEmpty(
        firstText(['[data-testid="job-location"]']),
        structured.location
      ),
      salary_text: firstNonEmpty(
        firstText(['[data-testid="salary-range"]']),
        structured.salary_text
      ),
      jd_text: firstNonEmpty(
        firstMainText(['main', '[data-testid="job-description"]', '.job-description']),
        structured.jd_text,
        cleanText(document.body.innerText)
      ),
    };
  }

  function extractGeneric() {
    const structured = readJobPostingData() || {};

    return {
      source_site: detectSourceSite(location.hostname),
      job_url: firstNonEmpty(structured.job_url, location.href),
      job_title: firstNonEmpty(
        firstText(['h1', 'main h1']),
        structured.job_title,
        cleanText(document.title)
      ),
      company: firstNonEmpty(
        firstText([
          '[data-testid="company-name"]',
          'a[href*="/company"]',
          'a[href*="/companies"]',
          '[class*="company"]',
        ]),
        structured.company
      ),
      industry: firstNonEmpty(structured.industry),
      location: firstNonEmpty(
        firstText([
          '[data-testid="job-location"]',
          '[class*="location"]',
        ]),
        structured.location
      ),
      salary_text: firstNonEmpty(
        firstText([
          '[data-testid="salary-range"]',
          '[class*="salary"]',
        ]),
        structured.salary_text
      ),
      jd_text: firstNonEmpty(
        firstMainText(['main', 'article', '[role="main"]']),
        structured.jd_text,
        cleanText(document.body.innerText)
      ),
    };
  }

  function extractJobData() {
    const hostname = location.hostname;

    if (hostname.includes('104.com.tw')) {
      return extract104();
    }

    if (hostname.includes('cakeresume.com')) {
      return extractCakeResume();
    }

    return extractGeneric();
  }

  self.JDSaverExtractors = {
    extractJobData,
  };
})();
