export function splitIntoChunks(text: string, size = 180, overlap = 35) {
  const words = text.replace(/\r\n/g, "\n").split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    const chunk = words.slice(start, start + size).join(" ").trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}
