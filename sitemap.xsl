<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
    xmlns:html="http://www.w3.org/TR/REC-html40"
    xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>GToolix XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          :root {
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --bg: #0b0f19;
            --card-bg: #111827;
            --text: #f3f4f6;
            --text-secondary: #9ca3af;
            --border: #1f2937;
            --badge-bg: rgba(37, 99, 235, 0.15);
            --badge-text: #60a5fa;
            --table-hover: #1e293b;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 2rem 1rem;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .brand-wrap {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .brand-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
          }
          .brand-badge {
            background: var(--badge-bg);
            color: var(--badge-text);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.6rem;
            border-radius: 9999px;
            border: 1px solid rgba(96, 165, 250, 0.3);
          }
          .description {
            color: var(--text-secondary);
            font-size: 0.95rem;
            max-width: 800px;
          }
          .stats-bar {
            display: flex;
            gap: 1.5rem;
            margin-top: 0.5rem;
          }
          .stat-item {
            background: var(--card-bg);
            border: 1px solid var(--border);
            padding: 0.75rem 1.25rem;
            border-radius: 0.5rem;
          }
          .stat-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .stat-val {
            font-size: 1.25rem;
            font-weight: 700;
            color: #ffffff;
          }
          .table-container {
            overflow-x: auto;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
          }
          th {
            background-color: rgba(31, 41, 55, 0.7);
            color: var(--text-secondary);
            font-weight: 600;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border);
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
          }
          td {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border);
            color: var(--text);
            vertical-align: middle;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background-color: var(--table-hover);
          }
          a {
            color: #60a5fa;
            text-decoration: none;
            word-break: break-all;
            transition: color 0.15s ease;
          }
          a:hover {
            color: #93c5fd;
            text-decoration: underline;
          }
          .badge {
            display: inline-block;
            padding: 0.2rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .badge-freq {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(52, 211, 153, 0.3);
          }
          .badge-priority {
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(251, 191, 36, 0.3);
          }
          footer {
            margin-top: 2.5rem;
            text-align: center;
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
          footer a {
            color: var(--text-secondary);
          }
          footer a:hover {
            color: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div class="brand-wrap">
              <h1 class="brand-title">GToolix XML Sitemap</h1>
              <span class="brand-badge">Search Index</span>
            </div>
            <p class="description">
              This is a standard XML Sitemap generated for search engine crawlers (Google, Bing, Yandex). It lists all canonical URLs, their priority, change frequency, and multilingual alternates.
            </p>
            <div class="stats-bar">
              <div class="stat-item">
                <div class="stat-label">Total URLs</div>
                <div class="stat-val"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Specification</div>
                <div class="stat-val">Sitemaps.org 0.9</div>
              </div>
            </div>
          </header>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>URL (Location)</th>
                  <th style="width: 140px;">Change Freq</th>
                  <th style="width: 100px;">Priority</th>
                  <th style="width: 140px;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td style="color: var(--text-secondary); font-weight: 600;"><xsl:value-of select="position()"/></td>
                    <td>
                      <a href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <span class="badge badge-freq"><xsl:value-of select="sitemap:changefreq"/></span>
                    </td>
                    <td>
                      <span class="badge badge-priority"><xsl:value-of select="sitemap:priority"/></span>
                    </td>
                    <td style="color: var(--text-secondary); white-space: nowrap;">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <footer>
            <p>&copy; 2026 <a href="https://www.gtoolix.com/">GToolix</a> — All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
