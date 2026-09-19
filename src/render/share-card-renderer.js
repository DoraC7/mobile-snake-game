// @ts-check

/** @param {object} result @param {string} title @param {string} modeLabel */
export async function createShareCard(result, title, modeLabel) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#080c18');
  gradient.addColorStop(1, '#10283a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 12;
  ctx.strokeRect(48, 48, 984, 984);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00e5ff';
  ctx.font = '800 72px system-ui';
  ctx.fillText(title, 540, 190);
  ctx.fillStyle = '#e2e8f4';
  ctx.font = '900 280px system-ui';
  ctx.fillText(String(result.score), 540, 530);
  ctx.font = '700 52px system-ui';
  ctx.fillText(modeLabel, 540, 650);
  ctx.fillStyle = '#ffd66b';
  ctx.font = '700 42px system-ui';
  ctx.fillText(`MAX COMBO ${result.maxCombo || 0}  ·  LV ${result.maxSpeedLevel || 1}`, 540, 750);
  ctx.fillStyle = 'rgba(226,232,244,.65)';
  ctx.font = '500 34px system-ui';
  ctx.fillText(new Date(result.endedAt || Date.now()).toLocaleDateString(), 540, 900);
  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export async function shareResult(result, title, modeLabel, shareText) {
  const blob = await createShareCard(result, title, modeLabel);
  if (!blob) return false;
  const file = new File([blob], 'snake-score.png', { type: 'image/png' });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ title, text: shareText, files: [file] });
    return true;
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'snake-score.png';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  return true;
}
