export const colors = {
  bg: "#FAFBF7", surface: "#FFFFFF", primary: "#267569", primaryStrong: "#1F665B", primaryLight: "#E1F4EA",
  lavender: "#ECE7FA", lavenderInk: "#5B3FA6", peach: "#FBE9DE", peachInk: "#9A4A1E", sky: "#E3F1FC", skyInk: "#1F5F9E",
  yellow: "#FFF2D8", yellowInk: "#8A5A00", text: "#243B3A", textMuted: "#5B6E6C", border: "#E4EAE5", borderStrong: "#A9B8B3", danger: "#B42318",
} as const;

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
