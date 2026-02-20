/* ===== CGPA Calculator – Script ===== */

(function () {
  'use strict';

  var MAX_COURSES = 12;
  var MIN_COURSES = 1;
  var courseCount = 0;
  var courseIdCounter = 0;

  /* ---------- DOM refs ---------- */
  var courseList = document.getElementById('courseList');
  var addBtn = document.getElementById('addCourseBtn');
  var calcBtn = document.getElementById('calculateBtn');
  var resetBtn = document.getElementById('resetBtn');
  var resultPlaceholder = document.getElementById('resultPlaceholder');
  var resultDisplay = document.getElementById('resultDisplay');
  var cgpaValue = document.getElementById('cgpaValue');
  var cgpaFeedback = document.getElementById('cgpaFeedback');
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
      /* Fallback: copy URL to clipboard */
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
    setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 2000);
  }

  /* ---------- Course management ---------- */
  function createCourseRow() {
    if (courseCount >= MAX_COURSES) return;
    courseIdCounter++;
    courseCount++;
    var id = courseIdCounter;
    var row = document.createElement('div');
    row.className = 'course-row';
    row.setAttribute('role', 'listitem');
    row.setAttribute('data-course-id', id);
    row.innerHTML =
      '<span class="course-num">' + courseCount + '</span>' +
      '<input class="course-name" type="text" placeholder="e.g. Mathematics" aria-label="Course ' + courseCount + ' name">' +
      '<div class="credit-stepper">' +
        '<button class="step-btn step-down" type="button" aria-label="Decrease credits" data-dir="-1">−</button>' +
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

    /* stepper buttons */
    var creditInput = row.querySelector('.credit-input');
    row.querySelector('.step-down').addEventListener('click', function () { stepCredit(creditInput, -1); });
    row.querySelector('.step-up').addEventListener('click', function () { stepCredit(creditInput, 1); });
    creditInput.addEventListener('change', function () { clampCredit(creditInput); });

    /* remove button */
    row.querySelector('.remove-btn').addEventListener('click', function () { removeCourse(row); });

    updateAddBtnState();
    renumberCourses();
    return row;
  }

  function stepCredit(input, dir) {
    var val = parseInt(input.value, 10) || 0;
    val = Math.min(10, Math.max(0, val + dir));
    input.value = val;
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

  addBtn.addEventListener('click', function () { createCourseRow(); });

  /* ---------- Calculate ---------- */
  function result() {
    var rows = courseList.querySelectorAll('.course-row');
    var num = 0;
    var den = 0;

    for (var i = 0; i < rows.length; i++) {
      var c = parseInt(rows[i].querySelector('.credit-input').value, 10) || 0;
      var g = parseInt(rows[i].querySelector('.grade').value, 10);
      num += c * g;
      den += c;
    }

    if (den === 0) {
      resultPlaceholder.style.display = 'block';
      resultDisplay.style.display = 'none';
      resultPlaceholder.innerHTML = '<p class="error-msg">Please set credits for at least one course.</p>';
      return;
    }

    var cgpa = (num / den).toFixed(2);
    cgpaValue.textContent = cgpa;

    /* Color-coded feedback */
    var numCgpa = parseFloat(cgpa);
    var feedback = '';
    var cls = '';
    if (numCgpa >= 9) {
      feedback = 'Outstanding! 🎉';
      cls = 'result--excellent';
    } else if (numCgpa >= 8) {
      feedback = 'Great job! Keep it up!';
      cls = 'result--great';
    } else if (numCgpa >= 7) {
      feedback = 'Good work!';
      cls = 'result--good';
    } else if (numCgpa >= 6) {
      feedback = 'Average — room for improvement.';
      cls = 'result--average';
    } else {
      feedback = 'Needs improvement.';
      cls = 'result--low';
    }
    cgpaFeedback.textContent = feedback;

    var resultCard = document.getElementById('resultCard');
    resultCard.className = 'result-card ' + cls;

    resultPlaceholder.style.display = 'none';
    resultDisplay.style.display = 'flex';

    /* celebration */
    cele.style.display = numCgpa >= 9 ? 'flex' : 'none';
  }

  calcBtn.addEventListener('click', result);

  /* ---------- Reset ---------- */
  resetBtn.addEventListener('click', function () {
    /* Remove all rows */
    courseList.innerHTML = '';
    courseCount = 0;
    courseIdCounter = 0;

    /* Re-add default rows */
    for (var i = 0; i < 6; i++) { createCourseRow(); }

    /* Reset result */
    resultPlaceholder.style.display = 'block';
    resultDisplay.style.display = 'none';
    resultPlaceholder.innerHTML = '<p>Set credits and grades above, then press <strong>Calculate</strong></p>';
    var resultCard = document.getElementById('resultCard');
    resultCard.className = 'result-card';
  });

  /* ---------- Init ---------- */
  for (var i = 0; i < 6; i++) { createCourseRow(); }

})();
