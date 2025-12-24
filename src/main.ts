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

type BooksListResponse = {
  books: Array<{
    id: number;
    title: string;
    author?: string;
    genre?: string;
    status?: string;
    cover_url?: string;
    stream_url?: string;
  }>;
};

type SubscriptionStatus = {
  account_type: 'free' | 'paid';
  has_subscription: boolean;
  subscription_status: string;
  subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  plan_name?: string;
  plan_amount?: number;
  plan_currency?: string;
  plan_interval?: 'month' | 'year';
};

type MostPlayedBook = {
  book_id: number;
  title: string;
  author: string;
  genre: string;
  category: string;
  cover_url: string;
  play_count: number;
  total_listen_time: number;
  last_played_at: string;
};

type MostPlayedResponse = {
  most_played: MostPlayedBook[];
  count: number;
  total_plays: number;
  total_listen_time: number;
};

type GenreStats = {
  genre: string;
  book_count: number;
  total_plays: number;
  total_listen_time: number;
};

type GenreStatsResponse = {
  genres: GenreStats[];
  genre_count: number;
  total_books: number;
  total_plays: number;
  total_listen_time: number;
};

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

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
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
  const playsEl = document.getElementById('total-plays');
  const favGenreEl = document.getElementById('favorite-genre');
  const subPlanEl = document.getElementById('subscription-plan');
  const subStatusEl = document.getElementById('subscription-status');
  const cancelBtn = document.getElementById('cancel-subscription-btn');
  const deleteForm = document.getElementById('delete-account-form') as HTMLFormElement | null;
  const deletePassword = document.getElementById('delete-account-password') as HTMLInputElement | null;
  const mostPlayedList = document.getElementById('most-played-list');
  const genreList = document.getElementById('genre-list');

  try {
    const [profile, subscription, books, mostPlayed, genreStats] = await Promise.all([
      api.get<UserProfile>('/user/profile'),
      api.get<SubscriptionStatus>('/user/subscription/status'),
      api.get<BooksListResponse>('/user/books'),
      api.get<MostPlayedResponse>('/user/stats/most-played?limit=3'),
      api.get<GenreStatsResponse>('/user/stats/by-genre'),
    ]);

    nameEl && (nameEl.textContent = profile.username);
    emailEl && (emailEl.textContent = profile.email);
    accountEl && (accountEl.textContent = subscription.account_type === 'paid' ? 'Premium' : 'Free');
    createdEl && (createdEl.textContent = new Date(profile.created_at).toLocaleDateString());
    booksEl && (booksEl.textContent = `${books.books.length}`);

    hoursEl && (hoursEl.textContent = formatHours(genreStats.total_listen_time || 0));
    playsEl && (playsEl.textContent = `${genreStats.total_plays || 0}`);
    favGenreEl && (favGenreEl.textContent = genreStats.genres?.[0]?.genre || '—');
    subPlanEl &&
      (subPlanEl.textContent = subscription.has_subscription
        ? subscription.plan_name || 'Premium'
        : 'Free');
    subStatusEl &&
      (subStatusEl.textContent = subscription.has_subscription
        ? subscription.subscription_status || 'Active'
        : 'Not subscribed');

    if (mostPlayedList) {
      mostPlayedList.innerHTML = '';
      (mostPlayed.most_played || []).forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.title}</strong> · ${item.genre} · ${formatHours(
          item.total_listen_time
        )}`;
        mostPlayedList.appendChild(li);
      });
    }

    if (genreList) {
      genreList.innerHTML = '';
      (genreStats.genres || []).slice(0, 4).forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.genre} — ${formatHours(item.total_listen_time)} (${item.total_plays} plays)`;
        genreList.appendChild(li);
      });
    }

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

async function loadLibrary() {
  if (!guardAuth()) return;

  const listEl = document.getElementById('library-list');
  const emptyEl = document.getElementById('library-empty');

  const renderEmpty = () => {
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
  };

  try {
    const data = await api.get<BooksListResponse>('/user/books');
    const books = data.books || [];

    if (!books.length) {
      renderEmpty();
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    if (!listEl) return;

    listEl.innerHTML = '';
    books.forEach((book) => {
      const card = document.createElement('article');
      card.className = 'library-card';
      const coverStyle = book.cover_url
        ? `style="background-image:url('${book.cover_url}');"`
        : '';
      card.innerHTML = `
        <div class="library-cover" ${coverStyle}></div>
        <div class="library-top">
          <div>
            <p class="kpi-value">${book.title}</p>
            <p class="kpi-label">${book.author || 'Unknown'} · ${book.genre || '—'}</p>
          </div>
          <span class="chip">${book.status}</span>
        </div>
        <div class="library-actions">
          <a class="secondary-btn" href="${book.stream_url || '/user/books/stream/proxy/' + book.id}">Listen</a>
          <button class="ghost-btn danger-btn" data-book-id="${book.id}">Delete</button>
        </div>
      `;
      listEl.appendChild(card);
    });

    listEl.querySelectorAll<HTMLButtonElement>('[data-book-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const bookId = btn.dataset.bookId;
        if (!bookId) return;
        const confirmDelete = window.confirm('Delete this book from your library?');
        if (!confirmDelete) return;
        try {
          await api.delete(`/user/books/${bookId}`);
          showToast('Book deleted', 'success');
          btn.closest('.library-card')?.remove();
          if (!listEl.childElementCount) renderEmpty();
        } catch (error) {
          const err = error as APIError;
          showToast(err.error || 'Unable to delete book.', 'error');
        }
      });
    });
  } catch (error) {
    const err = error as APIError;
    showToast(err.error || 'Unable to load library.', 'error');
    renderEmpty();
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

  if (page === 'library') {
    loadLibrary();
  }
});
