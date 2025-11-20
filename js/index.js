const launchBtn = document.getElementById('launch-btn');
const reentryBtn = document.getElementById('reentry-btn');
const launchPanel = document.getElementById('launch-panel');
const reentryPanel = document.getElementById('reentry-panel');

launchPanel.style.backgroundImage = "url('assets/images/esa_launch.jpg')";
reentryPanel.style.backgroundImage = "url('assets/images/esa_reentry.jpg')";

// Hover effects
launchBtn.addEventListener('mouseenter', () => {
    launchPanel.style.flex = "8"; // 75% width
    reentryPanel.style.flex = "4"; // 25% width
    launchPanel.style.filter = "blur(0px)";   // remove blur
    reentryPanel.style.filter = "blur(4px)";  // blur other
  });
  
  launchBtn.addEventListener('mouseleave', () => {
    launchPanel.style.flex = "1";
    reentryPanel.style.flex = "1";
    launchPanel.style.filter = "blur(4px)";   // reset blur
    reentryPanel.style.filter = "blur(4px)";
  });
  
  reentryBtn.addEventListener('mouseenter', () => {
    launchPanel.style.flex = "4"; 
    reentryPanel.style.flex = "8";
    launchPanel.style.filter = "blur(4px)";
    reentryPanel.style.filter = "blur(0px)";
  });
  
  reentryBtn.addEventListener('mouseleave', () => {
    launchPanel.style.flex = "1";
    reentryPanel.style.flex = "1";
    launchPanel.style.filter = "blur(4px)";   // reset blur
    reentryPanel.style.filter = "blur(4px)";
  });