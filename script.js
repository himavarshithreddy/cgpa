/* ===== CGPA Calculator - Script ===== */

(function () {
  'use strict';

  var MAX_COURSES = 12;
  var MIN_COURSES = 1;
  var DEFAULT_COURSES = 6;
  var STORAGE_KEY = 'cgpa-calculator-state-v1';
  var courseCount = 0;
  var courseIdCounter = 0;
  var SAMPLE_COURSES = [
    { name: 'Mathematics', credits: 4, grade: 9 },
    { name: 'Data Structures', credits: 4, grade: 10 },
    { name: 'Digital Systems', credits: 3, grade: 8 },
    { name: 'Operating Systems', credits: 4, grade: 9 },
    { name: 'English', credits: 2, grade: 8 },
    { name: 'Lab', credits: 2, grade: 10 }
  ];

  /* ---------- DOM refs ---------- */
  var courseList = document.getElementById('courseList');
  var addBtn = document.getElementById('addCourseBtn');
  var loadSampleBtn = document.getElementById('loadSampleBtn');
  var copySummaryBtn = document.getElementById('copySummaryBtn');
  var calcBtn = document.getElementById('calculateBtn');
  var resetBtn = document.getElementById('resetBtn');
  var resultPlaceholder = document.getElementById('resultPlaceholder');
  var resultDisplay = document.getElementById('resultDisplay');
  var cgpaValue = document.getElementById('cgpaValue');
  var cgpaFeedback = document.getElementById('cgpaFeedback');
  var resultMetrics = document.getElementById('resultMetrics');
  var resultInsight = document.getElementById('resultInsight');
  var cele = document.getElementById('cele');
  var themeToggle = document.getElementById('themeToggle');
  var shareBtn = document.getElementById('shareBtn');

  /* ---------- Theme ---------- */
  function applyTheme(dark) {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) { /* ignore */ }
    if (stored === 'dark') {
      applyTheme(true);
    } else if (stored === 'light') {
      applyTheme(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme(true);
    }
  }

  initTheme();

  themeToggle.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
    saveState();
  });

  /* ---------- Share ---------- */
  shareBtn.addEventListener('click', function () {
    if (navigator.share) {
      navigator.share({
        title: 'SRM CGPA Calculator',
        text: 'Calculate your CGPA using SRM CGPA Calculator',
        url: 'https://cgpacalculator.himavarshithreddy.in'
      }).catch(function () { /* user cancelled */ });
    } else {
      var url = 'https://cgpacalculator.himavarshithreddy.in';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showTooltip(shareBtn, 'Link copied!');
        });
      } else {
        showTooltip(shareBtn, 'Copy this link: ' + url);
      }
    }
  });

  function showTooltip(el, msg) {
    var tip = document.createElement('span');
    tip.className = 'tooltip';
    tip.textContent = msg;
    el.style.position = 'relative';
    el.appendChild(tip);
    setTimeout(function () {
      if (tip.parentNode) tip.parentNode.removeChild(tip);
    }, 2000);
  }

  function getDefaultResultMessage() {
    return '<p>Set credits and grades above, then press <strong>Calculate</strong></p>';
  }

  function getCourseData() {
    var rows = courseList.querySelectorAll('.course-row');
    var courses = [];

    for (var i = 0; i < rows.length; i++) {
      courses.push({
        name: rows[i].querySelector('.course-name').value.trim(),
        credits: parseInt(rows[i].querySelector('.credit-input').value, 10) || 0,
        grade: parseInt(rows[i].querySelector('.grade').value, 10)
      });
    }

    return courses;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        courses: getCourseData(),
        theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
      }));
    } catch (e) { /* ignore */ }
  }

  function clearResultState() {
    resultPlaceholder.style.display = 'block';
    resultDisplay.style.display = 'none';
    resultPlaceholder.innerHTML = getDefaultResultMessage();
    resultMetrics.innerHTML = '';
    resultInsight.textContent = '';
    document.getElementById('resultCard').className = 'result-card';
  }

  /* ---------- Course management ---------- */
  function createCourseRow() {
    if (courseCount >= MAX_COURSES) return null;

    courseIdCounter++;
    courseCount++;

    var row = document.createElement('div');
    row.className = 'course-row';
    row.setAttribute('role', 'listitem');
    row.setAttribute('data-course-id', courseIdCounter);
    row.innerHTML =
      '<span class="course-num">' + courseCount + '</span>' +
      '<input class="course-name" type="text" placeholder="e.g. Mathematics" aria-label="Course ' + courseCount + ' name">' +
      '<div class="credit-stepper">' +
        '<button class="step-btn step-down" type="button" aria-label="Decrease credits" data-dir="-1">-</button>' +
        '<input class="credit-input" type="number" min="0" max="10" value="0" aria-label="Course ' + courseCount + ' credits">' +
        '<button class="step-btn step-up" type="button" aria-label="Increase credits" data-dir="1">+</button>' +
      '</div>' +
      '<select class="grade" aria-label="Course ' + courseCount + ' grade">' +
        '<option value="10">O</option>' +
        '<option value="9">A+</option>' +
        '<option value="8">A</option>' +
        '<option value="7">B+</option>' +
        '<option value="6">B</option>' +
        '<option value="5">C</option>' +
        '<option value="0">F</option>' +
      '</select>' +
      '<button class="remove-btn" type="button" aria-label="Remove course ' + courseCount + '" title="Remove course">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';

    courseList.appendChild(row);

    var creditInput = row.querySelector('.credit-input');
    var courseNameInput = row.querySelector('.course-name');
    var gradeSelect = row.querySelector('.grade');

    row.querySelector('.step-down').addEventListener('click', function () { stepCredit(creditInput, -1); });
    row.querySelector('.step-up').addEventListener('click', function () { stepCredit(creditInput, 1); });
    creditInput.addEventListener('change', function () {
      clampCredit(creditInput);
      saveState();
    });
    creditInput.addEventListener('input', saveState);
    courseNameInput.addEventListener('input', saveState);
    gradeSelect.addEventListener('change', saveState);
    row.querySelector('.remove-btn').addEventListener('click', function () { removeCourse(row); });

    updateAddBtnState();
    renumberCourses();
    return row;
  }

  function stepCredit(input, dir) {
    var val = parseInt(input.value, 10) || 0;
    val = Math.min(10, Math.max(0, val + dir));
    input.value = val;
    saveState();
  }

  function clampCredit(input) {
    var val = parseInt(input.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 10) val = 10;
    input.value = val;
  }

  function removeCourse(row) {
    if (courseCount <= MIN_COURSES) return;

    row.classList.add('course-row--removing');
    setTimeout(function () {
      if (row.parentNode) row.parentNode.removeChild(row);
      courseCount--;
      renumberCourses();
      updateAddBtnState();
      saveState();
    }, 200);
  }

  function renumberCourses() {
    var rows = courseList.querySelectorAll('.course-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].querySelector('.course-num').textContent = i + 1;
    }
  }

  function updateAddBtnState() {
    addBtn.disabled = courseCount >= MAX_COURSES;
  }

  function setCourses(courses) {
    var i;
    courseList.innerHTML = '';
    courseCount = 0;
    courseIdCounter = 0;

    if (!courses.length) {
      for (i = 0; i < DEFAULT_COURSES; i++) {
        createCourseRow();
      }
      saveState();
      return;
    }

    for (i = 0; i < courses.length && i < MAX_COURSES; i++) {
      var row = createCourseRow();
      row.querySelector('.course-name').value = courses[i].name || '';
      row.querySelector('.credit-input').value = typeof courses[i].credits === 'number' ? courses[i].credits : 0;
      row.querySelector('.grade').value = String(typeof courses[i].grade === 'number' ? courses[i].grade : 10);
    }

    saveState();
  }

  function restoreState() {
    var raw = null;

    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (!raw) return false;

    try {
      var parsed = JSON.parse(raw);
      if (parsed.theme === 'dark') {
        applyTheme(true);
      } else if (parsed.theme === 'light') {
        applyTheme(false);
      }
      if (parsed.courses && parsed.courses.length) {
        setCourses(parsed.courses);
        return true;
      }
    } catch (e2) { /* ignore */ }

    return false;
  }

  addBtn.addEventListener('click', function () {
    createCourseRow();
    saveState();
  });

  /* ---------- Calculate ---------- */
  function calculateMetrics() {
    var courses = getCourseData();
    var num = 0;
    var den = 0;
    var passedCount = 0;
    var failedCount = 0;
    var lowestCourse = null;

    for (var i = 0; i < courses.length; i++) {
      var credits = courses[i].credits;
      var grade = courses[i].grade;

      num += credits * grade;
      den += credits;

      if (credits > 0) {
        if (grade === 0) {
          failedCount++;
        } else {
          passedCount++;
        }

        if (!lowestCourse || grade < lowestCourse.grade || (grade === lowestCourse.grade && credits > lowestCourse.credits)) {
          lowestCourse = {
            name: courses[i].name || 'an unnamed course',
            grade: grade,
            credits: credits
          };
        }
      }
    }

    return {
      cgpa: den ? parseFloat((num / den).toFixed(2)) : 0,
      totalCredits: den,
      courseCount: courses.length,
      passedCount: passedCount,
      failedCount: failedCount,
      lowestCourseName: lowestCourse ? lowestCourse.name : ''
    };
  }

  function renderMetrics(metrics) {
    resultMetrics.innerHTML =
      '<div class="metric-chip"><span class="metric-label">Credits</span><strong>' + metrics.totalCredits + '</strong></div>' +
      '<div class="metric-chip"><span class="metric-label">Courses</span><strong>' + metrics.courseCount + '</strong></div>' +
      '<div class="metric-chip"><span class="metric-label">Passed</span><strong>' + metrics.passedCount + '</strong></div>' +
      '<div class="metric-chip"><span class="metric-label">Failed</span><strong>' + metrics.failedCount + '</strong></div>';
  }

  function getInsight(metrics) {
    if (!metrics.failedCount && metrics.cgpa >= 9) {
      return 'Strong semester. You cleared every course and stayed in the top CGPA band.';
    }
    if (metrics.failedCount) {
      return metrics.failedCount + ' course' + (metrics.failedCount > 1 ? 's are' : ' is') + ' currently affecting your CGPA the most. Improving those first will have the biggest impact.';
    }
    if (metrics.lowestCourseName) {
      return 'Your lowest-scoring course is ' + metrics.lowestCourseName + '. Raising that subject should move your CGPA fastest.';
    }
    return 'A small improvement in one high-credit course can noticeably lift your CGPA.';
  }

  function result() {
    var metrics = calculateMetrics();

    if (metrics.totalCredits === 0) {
      resultPlaceholder.style.display = 'block';
      resultDisplay.style.display = 'none';
      resultPlaceholder.innerHTML = '<p class="error-msg">Please set credits for at least one course.</p>';
      resultMetrics.innerHTML = '';
      resultInsight.textContent = '';
      return;
    }

    var cgpa = metrics.cgpa.toFixed(2);
    var feedback = '';
    var cls = '';

    cgpaValue.textContent = cgpa;

    if (metrics.cgpa >= 9) {
      feedback = 'Outstanding!';
      cls = 'result--excellent';
    } else if (metrics.cgpa >= 8) {
      feedback = 'Great job! Keep it up!';
      cls = 'result--great';
    } else if (metrics.cgpa >= 7) {
      feedback = 'Good work!';
      cls = 'result--good';
    } else if (metrics.cgpa >= 6) {
      feedback = 'Average - room for improvement.';
      cls = 'result--average';
    } else {
      feedback = 'Needs improvement.';
      cls = 'result--low';
    }

    cgpaFeedback.textContent = feedback;
    renderMetrics(metrics);
    resultInsight.textContent = getInsight(metrics);

    document.getElementById('resultCard').className = 'result-card ' + cls;
    resultPlaceholder.style.display = 'none';
    resultDisplay.style.display = 'flex';
    cele.style.display = metrics.cgpa >= 9 ? 'flex' : 'none';

    saveState();
  }

  calcBtn.addEventListener('click', result);

  loadSampleBtn.addEventListener('click', function () {
    setCourses(SAMPLE_COURSES);
    result();
    showTooltip(loadSampleBtn, 'Sample semester loaded');
  });

  copySummaryBtn.addEventListener('click', function () {
    var metrics = calculateMetrics();
    var summary = '';

    if (!metrics.totalCredits) {
      showTooltip(copySummaryBtn, 'Add course credits first');
      return;
    }

    summary = 'SRM CGPA Summary\n' +
      'CGPA: ' + metrics.cgpa.toFixed(2) + '\n' +
      'Total credits: ' + metrics.totalCredits + '\n' +
      'Courses: ' + metrics.courseCount + '\n' +
      'Passed: ' + metrics.passedCount + '\n' +
      'Failed: ' + metrics.failedCount;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).then(function () {
        showTooltip(copySummaryBtn, 'Summary copied');
      }, function () {
        showTooltip(copySummaryBtn, 'Copy failed');
      });
    } else {
      showTooltip(copySummaryBtn, 'Clipboard unavailable');
    }
  });

  /* ---------- Reset ---------- */
  resetBtn.addEventListener('click', function () {
    setCourses([]);
    clearResultState();
    saveState();
  });

  /* ---------- Init ---------- */
  if (!restoreState()) {
    setCourses([]);
  }
  clearResultState();
})();
