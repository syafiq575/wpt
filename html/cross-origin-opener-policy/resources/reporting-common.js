// Allows RegExps to be pretty printed when printing unmatched expected reports.
Object.defineProperty(RegExp.prototype, "toJSON", {
  value: RegExp.prototype.toString
});

function wait(ms) {
  return new Promise(resolve => step_timeout(resolve, ms));
}

async function poll_reports(endpoint) {
  const res = await fetch(`resources/report.py?endpoint=${endpoint.name}`, {cache: 'no-store'});
  if (res.status !== 200) {
    return;
  }
  for (const report of await res.json()) {
    endpoint.reports.push(report);
  }
}

// Recursively check that all members of expectedReport are present or matched in report.
// report may have members not explicitly expected by expectedReport.
function is_object_as_expected(report, expectedReport) {
  if ((report === undefined || report === null || expectedReport === undefined || expectedReport === null)
      && report !== expectedReport )
    return false;
  if (expectedReport instanceof RegExp && typeof report === "string") {
    return expectedReport.test(report);
  }
  // Perform this check now, as RegExp and strings above have different typeof.
  if (typeof report !== typeof expectedReport)
    return false;
  if (typeof expectedReport === 'object') {
    return Object.keys(expectedReport).every(key => {
      return is_object_as_expected(report[key], expectedReport[key]);
    });
  }
  return report == expectedReport;
}

async function check_for_expected_report(expectedReport) {
  return new Promise( async (resolve, reject) => {
    const polls = 30;
    const waitTime = 100;
    for (var i=0; i < polls; ++i) {
      poll_reports(expectedReport.endpoint);
      for (var j=0; j<expectedReport.endpoint.reports.length; ++j){
        if (is_object_as_expected(expectedReport.endpoint.reports[j], expectedReport.report)){
          expectedReport.endpoint.reports.splice(j,1);
          resolve();
        }
      };
      await wait(waitTime);
    }
    reject("No report matched the expected report for endpoint: " + expectedReport.endpoint.name
      + ", expected report: " + JSON.stringify(expectedReport.report)
      + ", within available reports: " + JSON.stringify(expectedReport.endpoint.reports)
    );
  });
}

function replace_from_regex_or_string(str, match, value) {
  if (str instanceof RegExp) {
    return RegExp(str.source.replace(match, value));
  }
  return str.replace(match, value);
}

// Replace generated values in regexes and strings of an expected report:
// CHANNEL_NAME: the channel name is generated from the test parameters.
function replace_values_in_expectedReport(expectedReport, channelName) {
  if (expectedReport.report.body !== undefined) {
    if (expectedReport.report.body["document-uri"] !== undefined) {
      expectedReport.report.body["document-uri"] = replace_from_regex_or_string(expectedReport.report.body["document-uri"], "CHANNEL_NAME", channelName);
    }
    if (expectedReport.report.body["navigation-uri"] !== undefined) {
      expectedReport.report.body["navigation-uri"] = replace_from_regex_or_string(expectedReport.report.body["navigation-uri"], "CHANNEL_NAME", channelName);
    }
  }
  if (expectedReport.report.url !== undefined) {
      expectedReport.report.url = replace_from_regex_or_string(expectedReport.report.url, "CHANNEL_NAME", channelName);
  }
  return expectedReport;
}

// Run a test (such as coop_coep_test from ./common.js) then check that all expected reports are present.
async function reporting_test(testFunction, channelName, expectedReports) {
  await new Promise( async resolve => {
    testFunction(resolve);
  });
  expectedReports = Array.from(expectedReports, report => replace_values_in_expectedReport(report, channelName) );
  await Promise.all(Array.from(expectedReports, check_for_expected_report));
}

function coop_coep_reporting_test(testName, host, coop, coep, hasOpener, expectedReports){
  const channelName = `${testName.replace(/[ ;"=]/g,"-")}_to_${host.name}_${coop.replace(/[ ;"=]/g,"-")}_${coep}`;
  promise_test(async t => {
    await reporting_test( (resolve) => {
      coop_coep_test(t, host, coop, coep, channelName,
          hasOpener, undefined /* openerDOMAccess */, resolve);
    }, channelName, expectedReports);
  }, `coop reporting test ${channelName}`);
}

// Run an array of reporting tests then verify there's no reports that were not expected.
// The test array elements contain: host, coop, coep, hasOpener, expectedReports.
// See is_object_as_expected for explanations regarding the report matching behavior.
function run_coop_reporting_test(testName, tests){
  tests.forEach( test => {
    coop_coep_reporting_test(testName, test[0], test[1], test[2], test[3], test[4], test[5]);
  });
  verify_remaining_reports();
}

function coop_coep_redirect_reporting_test(testName, host, coop, coep, redirectHost, redirectCoop, redirectCoep, hasOpener, expectedReports){
  channelName = `${testName.replace(/[ ;"=]/g,"-")}_to_${host.name}_${coop.replace(/[ ;"=]/g,"-")}_${coep}_redirect_${redirectHost.name}_${redirectCoop.replace(/[ ;"=]/g,"-")}_${redirectCoep}`;
  promise_test(async t => {
    const redirectLocation = `${redirectHost.origin}/html/cross-origin-opener-policy/resources/coop-coep.py?coop=${encodeURIComponent(redirectCoop)}&coep=${redirectCoep}&channel=${channelName}`;
    await reporting_test( (resolve) => {
      url_test(t, `${host.origin}/html/cross-origin-opener-policy/resources/coop-coep.py?coop=${encodeURIComponent(coop)}&coep=${coep}&redirect=${encodeURIComponent(redirectLocation)}`,
        channelName, hasOpener, undefined /* openerDOMAccess */, resolve);
    }, channelName, expectedReports);
  }, `coop with redirect reporting test ${channelName}`);
}

// Run an array of reporting tests including a redirect then verify there's no reports that were not expected.
// The test input elements contain: host, coop, coep, redirectHost, redirectCoop, redirectCoep, hasOpener, expectedReports.
// where host, coop, coep are the initial values of the popup and redirect* describe the redirect destination.
// See is_object_as_expected for explanations regarding the report matching behavior.
function run_redirect_coop_reporting_test(testName, tests){
  tests.forEach( test => {
    coop_coep_redirect_reporting_test(testName, test[0], test[1], test[2], test[3], test[4], test[5], test[6], test[7]);
  });
  verify_remaining_reports();
}

const reportEndpoint = {
  name: "coop-report-endpoint",
  reports: []
}
const reportOnlyEndpoint = {
  name: "coop-report-only-endpoint",
  reports: []
}
const popupReportEndpoint = {
  name: "coop-popup-report-endpoint",
  reports: []
}
const popupReportOnlyEndpoint = {
  name: "coop-popup-report-only-endpoint",
  reports: []
}
const redirectReportEndpoint = {
  name: "coop-redirect-report-endpoint",
  reports: []
}
const redirectReportOnlyEndpoint = {
  name: "coop-redirect-report-only-endpoint",
  reports: []
}

const reportEndpoints = [
  reportEndpoint,
  reportOnlyEndpoint,
  popupReportEndpoint,
  popupReportOnlyEndpoint,
  redirectReportEndpoint,
  redirectReportOnlyEndpoint
]

function verify_remaining_reports() {
  promise_test( async t => {
    await Promise.all(Array.from(reportEndpoints, (endpoint) => {
      return new Promise( async (resolve, reject) => {
        await poll_reports(endpoint);
        if (endpoint.reports.length != 0)
          reject( `${endpoint.name} not empty`);
        resolve();
      });
    }));
  }, "verify remaining reports");
}
