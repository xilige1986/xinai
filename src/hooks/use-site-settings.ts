'use client';

import { useState, useEffect } from 'react';

interface SiteSettings {
  siteName: string;
  siteDomain: string;
  siteLogo: string;
  siteFavicon: string;
  siteDescription: string;
  siteKeywords: string;
  siteIcp: string;
  siteIcpLink: string;
  siteEmail: string;
  siteCopyright: string;
  footerText: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'AI工具库',
  siteDomain: 'localhost:3000',
  siteLogo: '/logo.svg',
  siteFavicon: '/favicon.ico',
  siteDescription: '发现优质AI工具，提升工作效率',
  siteKeywords: 'AI工具,人工智能,AI应用,AI软件',
  siteIcp: '',
  siteIcpLink: '',
  siteEmail: '',
  siteCopyright: '',
  footerText: '',
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/site');
        if (response.ok) {
          const data = await response.json();
          setSettings({ ...defaultSettings, ...data.settings });
        }
      } catch (error) {
        console.error('Failed to load site settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  return { settings, isLoading };
}

export { defaultSettings };
