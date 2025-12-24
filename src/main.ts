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

type UserProfile = {
  username: string;
  email: string;
  account_type: 'free' | 'paid';
  is_public: boolean;
  state: string;
  books_read: number;
  created_at: string;
};

type AccountTypeResponse = {
  account_type: 'free' | 'paid';
};

type BooksListResponse = {
  books: Array<{
    id: number;
    title: string;
  }>;
};

type PlaybackProgress = {
  total_listen_time: number;
};

type ProgressResponse = PlaybackProgress[];

type SubscriptionCancelResponse = {
  message: string;
  cancel_at_period_end: boolean;
  current_period_end?: string;
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

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: this.headers(),
    });

    if (!response.ok) {
      throw (await response.json()) as APIError;
    }

    return response.json();
  }

  async post<T>(path: string, body?: object): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw (await response.json()) as APIError;
    }

    return response.json();
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
        window.location.href = '/home';
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

function guardAuth(): string | null {
  const token = api.getToken();
  if (!token) {
    window.location.href = '/';
    return null;
  }
  return token;
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.max(1, Math.round(seconds / 60))} min`;
  return `${hours.toFixed(1)} hrs`;
}

async function loadProfileDashboard() {
  if (!guardAuth()) return;

  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const accountEl = document.getElementById('profile-account-type');
  const createdEl = document.getElementById('profile-created');
  const booksEl = document.getElementById('books-count');
  const hoursEl = document.getElementById('listening-time');
  const subPlanEl = document.getElementById('subscription-plan');
  const subStatusEl = document.getElementById('subscription-status');
  const cancelBtn = document.getElementById('cancel-subscription-btn');
  const deleteForm = document.getElementById('delete-account-form') as HTMLFormElement | null;
  const deletePassword = document.getElementById('delete-account-password') as HTMLInputElement | null;

  try {
    const [profile, accountType, books, progress] = await Promise.all([
      api.get<UserProfile>('/user/profile'),
      api.get<AccountTypeResponse>('/user/account-type'),
      api.get<BooksListResponse>('/user/books'),
      api.get<ProgressResponse>('/user/progress'),
    ]);

    nameEl && (nameEl.textContent = profile.username);
    emailEl && (emailEl.textContent = profile.email);
    accountEl && (accountEl.textContent = accountType.account_type === 'paid' ? 'Premium' : 'Free');
    createdEl && (createdEl.textContent = new Date(profile.created_at).toLocaleDateString());
    booksEl && (booksEl.textContent = `${books.books.length}`);

    const totalSeconds = progress.reduce((acc, item) => acc + (item.total_listen_time || 0), 0);
    hoursEl && (hoursEl.textContent = formatHours(totalSeconds));
    subPlanEl && (subPlanEl.textContent = accountType.account_type === 'paid' ? 'Premium Monthly' : 'Free');
    subStatusEl && (subStatusEl.textContent = accountType.account_type === 'paid' ? 'Active' : 'Not Subscribed');

    cancelBtn?.addEventListener('click', async () => {
      try {
        const data = await api.post<SubscriptionCancelResponse>('/user/subscription/cancel');
        subStatusEl && (subStatusEl.textContent = data.cancel_at_period_end ? 'Cancels at period end' : 'Canceled');
        showToast(data.message || 'Subscription updated', 'success');
      } catch (error) {
        const err = error as APIError;
        showToast(err.error || 'Unable to cancel subscription', 'error');
      }
    });

    deleteForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = deletePassword?.value || '';
      if (!password) {
        showToast('Enter your password to delete the account.', 'error');
        return;
      }
      try {
        await api.post('/user/delete', { password, reason: 'User requested deletion from profile page' });
        showToast('Account scheduled for deletion. You will be logged out.', 'success');
        localStorage.removeItem('token');
        setTimeout(() => (window.location.href = '/'), 1200);
      } catch (error) {
        const err = error as APIError;
        showToast(err.error || 'Could not delete account.', 'error');
      }
    });
  } catch (error) {
    const err = error as APIError;
    showToast(err.error || 'Unable to load profile.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'landing';

  if (page === 'landing') {
    bindAuthForms();
    animateStats();
    initCarousel();
    initHeroPlayer();
    wireModalLinks();
  }

  if (page === 'profile') {
    loadProfileDashboard();
  }
});
