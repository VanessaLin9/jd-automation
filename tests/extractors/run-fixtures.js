const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '../..');
const extractorSource = fs.readFileSync(
  path.join(rootDir, 'chrome-extension/extractors.js'),
  'utf8'
);

function node(textContent) {
  return { textContent };
}

function createFixtureDocument({ bodyText, selectors, title }) {
  return {
    title,
    body: {
      innerText: bodyText,
    },
    createElement() {
      return {
        innerHTML: '',
        get value() {
          return this.innerHTML;
        },
        get textContent() {
          return this.innerHTML.replace(/<[^>]+>/g, '');
        },
      };
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      return selectors.get(selector) || [];
    },
  };
}

function runExtractor({ document, location }) {
  const context = {
    document,
    location,
    self: {},
  };

  vm.createContext(context);
  vm.runInContext(extractorSource, context, {
    filename: 'chrome-extension/extractors.js',
  });

  return context.self.JDSaverExtractors.extractJobData();
}

function testYouratorFixture() {
  const selectors = new Map([
    ['script[type="application/ld+json"]', []],
    ['main h1', [node('Junior Frontend Engineer')]],
    ['h1', [node('Junior Frontend Engineer')]],
    ['main a[href^="/companies/"]', [node('adGeek')]],
    ['main a[href*="yourator.co/companies/"]', []],
    ['a[href^="/companies/"][href*="/jobs/"]', []],
    ['a[href*="yourator.co/companies/"][href*="/jobs/"]', []],
    ['main a[href*="/jobs?"]', [node('SaaS'), node('Advertising Technology')]],
    ['main a[href*="keyword"]', []],
    ['main a[href*="tag"]', []],
    ['main a[href*="google.com/maps"]', [node('臺北市 臺北市 臺北市內湖區行愛路77巷16號4.7.8樓')]],
    ['main a[href*="maps.google"]', []],
    ['main a[href*="/locations/"]', []],
    ['main a[href*="location"]', []],
    ['main [class*="salary"]', []],
    ['main [class*="Salary"]', []],
    ['main', [node('Yourator job page main content')]],
    ['article', []],
    ['[role="main"]', []],
  ]);
  const document = createFixtureDocument({
    title: 'Junior Frontend Engineer - adGeek | Yourator',
    selectors,
    bodyText: `
      Companies
      Jobs
      Junior Frontend Engineer
      adGeek
      臺北市 臺北市 臺北市內湖區行愛路77巷16號4.7.8樓

      Job Description
      Build user-facing product features.
      Collaborate with designers and backend engineers.

      Requirement
      Solid JavaScript fundamentals.
      Comfortable with browser APIs.

      Preferred Qualifications
      Chrome Extension experience is a plus.

      Benefits
      年度旅遊

      Salary Range
      NT$ 45,000 - 70,000 / month

      Similar Opportunities
      Frontend Engineer
    `,
  });

  const result = runExtractor({
    document,
    location: {
      hostname: 'www.yourator.co',
      href: 'https://www.yourator.co/companies/adGeek/jobs/46357',
    },
  });

  assert.equal(result.source_site, 'Yourator');
  assert.equal(result.job_url, 'https://www.yourator.co/companies/adGeek/jobs/46357');
  assert.equal(result.job_title, 'Junior Frontend Engineer');
  assert.equal(result.company, 'adGeek');
  assert.equal(result.location, '臺北市內湖區行愛路77巷16號4.7.8樓');
  assert.equal(result.salary_text, 'NT$ 45,000 - 70,000 / month');
  assert.equal(result.industry, 'SaaS / Advertising Technology');
  assert.match(result.jd_text, /Build user-facing product features/);
  assert.match(result.jd_text, /Solid JavaScript fundamentals/);
  assert.match(result.jd_text, /Chrome Extension experience is a plus/);
  assert.doesNotMatch(result.jd_text, /Benefits|年度旅遊|Salary Range|NT\$|Similar Opportunities/);
}

function testStructuredAddressDeduplication() {
  const jobPosting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: 'Backend Engineer',
    url: 'https://www.yourator.co/companies/example/jobs/123',
    hiringOrganization: {
      name: 'Example Co.',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressRegion: '臺北市',
        addressLocality: '臺北市',
        streetAddress: '臺北市內湖區行愛路77巷16號4.7.8樓',
      },
    },
    description: 'Build reliable backend systems.',
  };
  const document = createFixtureDocument({
    title: 'Backend Engineer - Example Co. | Yourator',
    selectors: new Map([
      ['script[type="application/ld+json"]', [node(JSON.stringify(jobPosting))]],
      ['main h1', []],
      ['h1', []],
      ['main a[href^="/companies/"]', []],
      ['main a[href*="yourator.co/companies/"]', []],
      ['a[href^="/companies/"][href*="/jobs/"]', []],
      ['a[href*="yourator.co/companies/"][href*="/jobs/"]', []],
      ['main a[href*="/jobs?"]', []],
      ['main a[href*="keyword"]', []],
      ['main a[href*="tag"]', []],
      ['main a[href*="google.com/maps"]', []],
      ['main a[href*="maps.google"]', []],
      ['main a[href*="/locations/"]', []],
      ['main a[href*="location"]', []],
      ['main [class*="salary"]', []],
      ['main [class*="Salary"]', []],
      ['main', []],
      ['article', []],
      ['[role="main"]', []],
    ]),
    bodyText: 'Backend Engineer',
  });

  const result = runExtractor({
    document,
    location: {
      hostname: 'www.yourator.co',
      href: 'https://www.yourator.co/companies/example/jobs/123',
    },
  });

  assert.equal(result.job_title, 'Backend Engineer');
  assert.equal(result.company, 'Example Co.');
  assert.equal(result.location, '臺北市內湖區行愛路77巷16號4.7.8樓');
}

testYouratorFixture();
testStructuredAddressDeduplication();
console.log('Extractor fixtures passed.');
