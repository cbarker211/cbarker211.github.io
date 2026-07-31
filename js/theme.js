(function () {
    'use strict';

    var KEY = 'oe-theme';

    function current() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function updateButtons(theme) {
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            var isLight = theme === 'light';
            btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
            btn.setAttribute('aria-label', 'Switch to ' + (isLight ? 'dark' : 'light') + ' mode');
            var label = btn.querySelector('.theme-toggle-label');
            if (label) label.textContent = isLight ? 'Dark Mode' : 'Light Mode';
        });
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(KEY, theme);
        updateButtons(theme);
        document.dispatchEvent(new CustomEvent('oe-themechange', { detail: { theme: theme } }));
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateButtons(current());
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setTheme(current() === 'light' ? 'dark' : 'light');
            });
        });
    });

    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: light)');
        var onChange = function (e) {
            if (!localStorage.getItem(KEY)) setTheme(e.matches ? 'light' : 'dark');
        };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
    }
}());
