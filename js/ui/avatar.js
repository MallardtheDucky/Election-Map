import { CANDIDATE_IMAGES } from '../core/config.js';
import { el, initials } from '../core/utils.js';

const INLINE_IMAGES = (window.APRP_INLINE && window.APRP_INLINE.images) || {};

export function createAvatar(name, party, className) {
  const wrapper = el('span', `avatar ${party} ${className || ''}`.trim());
  const path = CANDIDATE_IMAGES[name];
  const source = path ? INLINE_IMAGES[path] || encodeURI(path) : null;
  const fallback = () => {
    wrapper.textContent = initials(name);
    wrapper.classList.add('avatar-initials');
  };
  if (source) {
    const image = new Image();
    image.alt = name;
    image.addEventListener('error', () => {
      image.remove();
      fallback();
    });
    image.src = source;
    wrapper.appendChild(image);
  } else {
    fallback();
  }
  return wrapper;
}

export function mountAvatar(container, name, party, className) {
  container.replaceChildren(createAvatar(name, party, className));
}
