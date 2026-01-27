// assets/blog-posts.js
window.SWISSPLOIT_BLOG_POSTS = [
  {
    id: "wetransfer-phishing-html-onedrive",
    title: "Real Attack: WeTransfer Phishing → HTML File → Fake OneDrive Login",
    excerpt: "A real Microsoft account takeover via a WeTransfer phishing page that delivered a malicious HTML file.",
    date: "2026-01-27",
    image: "assets/blog/h355-014.png",
    tags: ["security", "phishing", "microsoft365", "onedrive", "outlook"],
    videoUrl: "https://www.youtube.com/watch?v=5aVeWRinSxM",
    content: `
      <p><strong>In this article (and video),</strong> I show you a real hacking incident where a client’s Microsoft account got compromised through a WeTransfer phishing attack.</p>

      <p>If you use <strong>Microsoft 365, OneDrive, Outlook</strong> or any Microsoft account, this is highly relevant.</p>

      <h2>How the attack unfolded</h2>
      <ul>
        <li>📩 The victim received a <strong>fake email</strong></li>
        <li>🔗 The email linked to a <strong>WeTransfer download page</strong></li>
        <li>📄 Instead of documents, it delivered a <strong>malicious HTML file</strong></li>
        <li>🔐 The file opened a <strong>fake OneDrive login page</strong></li>
        <li>❗ The victim entered the password — and the attackers <strong>took over the Microsoft account</strong></li>
      </ul>

      <h2>Why this works (and why it’s so common)</h2>
      <p>This technique is common and effective because it uses trust, familiar brands, and a “normal-looking” download step. Thousands of people fall for it daily.</p>

      <h2>What to do to avoid this</h2>
      <ul>
        <li><strong>Never</strong> open unexpected HTML files from downloads or email links</li>
        <li>Verify the sender context (even if it looks like a known supplier)</li>
        <li>Open links carefully and check the domain before logging in</li>
        <li>Enable <strong>MFA</strong> on Microsoft accounts (strongly recommended)</li>
      </ul>

      <p>If you found this helpful, share the video to warn others and subscribe for more Tech & Security content.</p>
    `
  }
];
