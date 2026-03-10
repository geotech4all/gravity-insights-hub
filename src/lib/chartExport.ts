import { toast } from 'sonner';

/**
 * Export a chart container element as PNG or SVG.
 * The container must contain an <svg> element (recharts).
 */
export function exportChartAsPNG(container: HTMLElement, filename: string) {
  const svg = container.querySelector('svg');
  if (!svg) { toast.error('No chart found to export'); return; }

  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Ensure white background for PNG
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'white');
  clone.insertBefore(rect, clone.firstChild);

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const scale = 2; // retina quality
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) { toast.error('Failed to generate PNG'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${filename}.png downloaded`);
    }, 'image/png');
  };
  img.onerror = () => { toast.error('Failed to render chart'); URL.revokeObjectURL(url); };
  img.src = url;
}

export function exportChartAsSVG(container: HTMLElement, filename: string) {
  const svg = container.querySelector('svg');
  if (!svg) { toast.error('No chart found to export'); return; }

  const clone = svg.cloneNode(true) as SVGSVGElement;
  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast.success(`${filename}.svg downloaded`);
}
