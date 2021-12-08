export const parseJSONScript = (document, id) => {
  const script = document.getElementById(id);
  try {
    return JSON.parse(script.innerHTML);
  } catch { return null }
};
