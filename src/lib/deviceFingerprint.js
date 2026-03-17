/**
 * Generates a unique device fingerprint based on browser/device characteristics.
 * This fingerprint is consistent across visits on the same device+browser.
 */
export async function getDeviceFingerprint() {
  const components = [];

  // Screen properties
  components.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
  components.push(`avail:${screen.availWidth}x${screen.availHeight}`);
  components.push(`pixel_ratio:${window.devicePixelRatio}`);

  // Navigator properties
  components.push(`platform:${navigator.platform}`);
  components.push(`lang:${navigator.language}`);
  components.push(`cores:${navigator.hardwareConcurrency || 'unknown'}`);
  components.push(`memory:${navigator.deviceMemory || 'unknown'}`);
  components.push(`touch:${navigator.maxTouchPoints || 0}`);

  // Timezone
  components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('FUCS-fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('FUCS-fingerprint', 4, 17);
    components.push(`canvas:${canvas.toDataURL().slice(-50)}`);
  } catch {
    components.push('canvas:unsupported');
  }

  // WebGL renderer
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(`gpu:${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`);
      }
    }
  } catch {
    components.push('gpu:unsupported');
  }

  // Generate hash from all components
  const raw = components.join('|');
  const hash = await sha256(raw);
  return hash;
}

async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
