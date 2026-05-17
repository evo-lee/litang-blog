import { siteConfig } from '@/lib/site';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div>
          <p className="footer__name">{siteConfig.footer.brand}</p>
          <p className="footer__line">
            {siteConfig.footer.tagline} · © {new Date().getFullYear()}
          </p>
        </div>
        <p className="footer__line">{siteConfig.footer.credits}</p>
      </div>
    </footer>
  );
}
