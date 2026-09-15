import React from 'react';
import { Helmet } from 'react-helmet-async';
import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, absoluteUrl } from '../config/site';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  type = 'website',
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt,
  noIndex = false,
  structuredData
}) => {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;

  /**
   * A canonical URL must be stated explicitly by the page.
   *
   * The previous fallback read `window.location.pathname`, which does not exist
   * while a page is being prerendered — so every document without an explicit
   * canonical silently claimed "/". That was most visible on the 404 page,
   * which was telling search engines it was the homepage.
   */
  const canonicalUrl = canonical ? absoluteUrl(canonical) : null;
  const imageUrl = absoluteUrl(image);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={imageAlt || title} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt || title} />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
