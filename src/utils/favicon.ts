export const getFaviconUrl = async (url: string): Promise<string> => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (error) {
    console.error('Error getting favicon:', error);
    return '/default-icon.png';
  }
};