async function getPageText(url) {
    const errorMsg = `Mudae Error: Could not load "${url}" text content`;
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(errorMsg);
      }

      return await response.text();
    }
    catch (error) {
      throw new Error(`Fetch error loading ${url}: ${error}`);
    }
  }

