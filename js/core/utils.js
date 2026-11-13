export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined && text !== null) {
    node.textContent = text;
  }
  return node;
}

export function byId(id) {
  return document.getElementById(id);
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return parts[parts.length - 1] || '';
}

export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  const first = parts[0] ? parts[0][0] : '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatReporting(value) {
  const rounded = Math.round(Number(value || 0) * 10) / 10;
  return `${rounded}%`;
}

export function icon(name, className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `icon${className ? ` ${className}` : ''}`);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.appendChild(use);
  return svg;
}
