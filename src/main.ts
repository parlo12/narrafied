type SignupPayload = {
  username: string;
  email: string;
  password: string;
  state: string;
};

type SignupResponse = {
  message: string;
  user_id: number;
};

type LoginPayload = {
  username: string;
  password: string;
};

type LoginResponse = {
  token: string;
};

type APIError = {
  error: string;
  details?: string;
};

const API_BASE =
  window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://narrafied.com';

class APIClient {
  private token: string | null = localStorage.getItem('token');

  private headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  async signup(payload: SignupPayload): Promise<SignupResponse> {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw (await response.json()) as APIError;
    }

    return response.json();
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw (await response.json()) as APIError;
    }

    const data = (await response.json()) as LoginResponse;
    this.token = data.token;
    localStorage.setItem('token', data.token);
    return data;
  }

  getToken(): string | null {
    return this.token;
  }
}

const api = new APIClient();

class ModalManager {
  private modals: NodeListOf<HTMLElement>;

  constructor() {
    this.modals = document.querySelectorAll<HTMLElement>('.modal');
    this.bindTriggers();
  }

  private bindTriggers() {
    const openers = document.querySelectorAll<HTMLElement>('[data-open-modal]');
    openers.forEach((opener) => {
      opener.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = opener.dataset.openModal;
        if (!targetId) return;
        this.open(targetId);
      });
    });

    const closers = document.querySelectorAll<HTMLElement>('[data-close-modal]');
    closers.forEach((closer) => {
      closer.addEventListener('click', () => this.closeAll());
    });

    this.modals.forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAll();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAll();
    });
  }

  open(id: string) {
    this.closeAll();
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeAll() {
    this.modals.forEach((modal) => {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    });
  }
}

const modalManager = new ModalManager();

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  toast.style.borderColor = type === 'success' ? 'rgba(255,138,61,0.35)' : 'rgba(255,82,82,0.6)';
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function bindAuthForms() {
  const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;
  const signinForm = document.getElementById('signin-form') as HTMLFormElement | null;

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const payload: SignupPayload = {
      username: (formData.get('username') as string) || '',
      email: (formData.get('email') as string) || '',
      password: (formData.get('password') as string) || '',
      state: (formData.get('state') as string) || '',
    };

    try {
      await api.signup(payload);
      showToast('Account created! Sign in to start listening.', 'success');
      modalManager.open('signin-modal');
    } catch (error) {
      const err = error as APIError;
      showToast(err.error || 'Unable to sign up. Please try again.', 'error');
    }
  });

  signinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signinForm);
    const payload: LoginPayload = {
      username: (formData.get('username') as string) || '',
      password: (formData.get('password') as string) || '',
    };

    try {
      await api.login(payload);
      showToast('Signed in! Redirecting to your library...', 'success');
      modalManager.closeAll();
      setTimeout(() => {
        window.location.href = '/library';
      }, 800);
    } catch (error) {
      const err = error as APIError;
      showToast(err.error || 'Check your credentials and try again.', 'error');
    }
  });
}

function animateStats() {
  const numbers = document.querySelectorAll<HTMLElement>('.stat-number');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = Number(entry.target.getAttribute('data-count') || '0');
          let current = 0;
          const step = Math.max(1, Math.round(target / 40));

          const interval = window.setInterval(() => {
            current += step;
            if (current >= target) {
              entry.target.textContent = `${target}+`;
              window.clearInterval(interval);
            } else {
              entry.target.textContent = `${current}`;
            }
          }, 18);

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  numbers.forEach((num) => observer.observe(num));
}

function initCarousel() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.carousel-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const track = document.getElementById(targetId);
      if (!track) return;
      const scrollAmount = 240;
      track.scrollBy({
        left: btn.classList.contains('next') ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    });
  });
}

function initHeroPlayer() {
  const progressSpan = document.querySelector<HTMLElement>('.progress-bar span');
  if (!progressSpan) return;

  let progress = 48;
  setInterval(() => {
    progress += Math.random() * 10 - 4;
    if (progress < 10) progress = 10;
    if (progress > 96) progress = 12;
    progressSpan.style.width = `${progress}%`;
  }, 2500);
}

function wireModalLinks() {
  const links = document.querySelectorAll<HTMLElement>('.modal [data-open-modal]');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.dataset.openModal;
      if (!targetId) return;
      modalManager.open(targetId);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindAuthForms();
  animateStats();
  initCarousel();
  initHeroPlayer();
  wireModalLinks();
});
