import lottie from 'https://cdn.skypack.dev/lottie-web';

const ANIMATIONS = {
  listening: 'https://assets8.lottiefiles.com/datafiles/abc.json',
  processing: 'https://assets4.lottiefiles.com/datafiles/def.json',
  idle: 'https://assets2.lottiefiles.com/datafiles/ghi.json'
};

export class AvatarManager {
  constructor(container) {
    this.container = container;
    this.currentAnim = null;
    this.loadFallback();
  }

  async play(state) {
    if (this.supportsLottie()) {
      await this.loadLottie(ANIMATIONS[state]);
    } else {
      this.playFallback(state);
    }
  }

  supportsLottie() {
    return 'requestIdleCallback' in window && !navigator.connection?.saveData;
  }

  async loadLottie(url) {
    if (this.currentAnim) this.currentAnim.destroy();
    
    this.currentAnim = lottie.loadAnimation({
      container: this.container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: url
    });
  }

  playFallback(state) {
    this.container.style.animation = `${state}-anim 2s ease`;
  }
}
