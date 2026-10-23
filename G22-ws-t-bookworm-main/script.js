const sideNav = document.querySelector(".side-nav");
const navLinks = sideNav.querySelectorAll("a");

const addBookButtons = document.querySelectorAll(".add-book, .add-tile");

const modalOverlay = document.querySelector(".modal-overlay");
const addBookForm = document.querySelector("#add-book-form");
const discardButton = document.querySelector("#discard-btn");

const bookshelfGrid = document.querySelector(".bookshelf-grid");
const readingList = document.querySelector(".reading-list");
const wantList = document.querySelector(".want-list");
const finishedList = document.querySelector(".finished-grid");

const currentCard = document.querySelector(".current-card");

const STORAGE_KEY = "myBookReaderBooks";
const STREAK_STORAGE_KEY = "myBookReaderStreak";

let editingBookId = null;

/* =================================
   PROFILE
================================= */

const profileButton =
  document.querySelector("#profile-btn");

const accountButton = document.querySelector("#account-btn");
const authOverlay = document.querySelector("#auth-overlay");
const authForm = document.querySelector("#auth-form");
const authNameGroup = document.querySelector("#auth-name-group");
const authNameInput = document.querySelector("#auth-name");
const authEmailInput = document.querySelector("#auth-email");
const authPasswordInput = document.querySelector("#auth-password");
const authTitle = document.querySelector("#auth-title");
const authStatus = document.querySelector("#auth-status");
const authSubmitButton = document.querySelector("#auth-submit-btn");
const authSwitchPrompt = document.querySelector("#auth-switch-prompt");
const authSwitchButton = document.querySelector("#auth-switch-btn");
let authMode = "login";
let authenticatedUser = null;

function setAuthenticatedUser(user) {
  authenticatedUser = user;
  const accountName = user?.name?.trim();
  if (accountName && (!profile.name || profile.name === "Reader")) {
    profile.name = accountName;
    saveProfile();
    renderProfile();
  }
  if (!accountButton) return;
  accountButton.textContent = user ? "Log out" : "Log in";
  accountButton.setAttribute("aria-label", user ? `Log out ${user.name}` : "Log in");
  accountButton.title = user ? `Signed in as ${user.email}` : "Log in or create an account";
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegistering = mode === "register";
  if (authTitle) authTitle.textContent = isRegistering ? "Create account" : "Log in";
  if (authSubmitButton) authSubmitButton.textContent = isRegistering ? "Create account" : "Log in";
  if (authNameGroup) authNameGroup.hidden = !isRegistering;
  if (authNameInput) authNameInput.required = isRegistering;
  if (authNameInput) authNameInput.autocomplete = isRegistering ? "name" : "off";
  if (authPasswordInput) authPasswordInput.autocomplete = isRegistering ? "new-password" : "current-password";
  if (authSwitchPrompt) authSwitchPrompt.textContent = isRegistering ? "Already have an account?" : "Need an account?";
  if (authSwitchButton) authSwitchButton.textContent = isRegistering ? "Log in" : "Create one";
  if (authStatus) authStatus.textContent = "";
}

function openAuthDialog() {
  if (!authOverlay || !authEmailInput) return;
  setAuthMode("login");
  authOverlay.classList.remove("invisible-page");
  authOverlay.classList.add("visible-page");
  document.body.style.overflow = "hidden";
  authEmailInput.focus();
}

function closeAuthDialog() {
  if (!authOverlay) return;
  authOverlay.classList.remove("visible-page");
  authOverlay.classList.add("invisible-page");
  document.body.style.overflow = "";
  accountButton?.focus();
}

async function loadAuthState() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    if (response.ok) setAuthenticatedUser(data.user);
  } catch (error) {
    authStatus.textContent = "Account service is unavailable.";
  }
}

async function logOut() {
  if (!accountButton) {
    setAuthenticatedUser(null);
    return;
  }

  accountButton.disabled = true;
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Logout failed");
    setAuthenticatedUser(null);
  } catch (error) {
    accountButton.title = "Could not log out. Check the server connection.";
  } finally {
    accountButton.disabled = false;
  }
}

if (accountButton) {
  accountButton.addEventListener("click", () => {
    if (authenticatedUser) logOut();
    else openAuthDialog();
  });
}

const closeAuthButton = document.querySelector("#close-auth-btn");
if (closeAuthButton) {
  closeAuthButton.addEventListener("click", closeAuthDialog);
}

if (authSwitchButton) {
  authSwitchButton.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
  });
}

if (authOverlay) {
  authOverlay.addEventListener("click", event => {
    if (event.target === authOverlay) closeAuthDialog();
  });
}

document.addEventListener("keydown", event => {
  if (authOverlay && event.key === "Escape" && authOverlay.classList.contains("visible-page")) {
    closeAuthDialog();
  }
});

if (authForm) {
  authForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (authStatus) authStatus.textContent = authMode === "register" ? "Creating your account…" : "Logging in…";
    if (authSubmitButton) authSubmitButton.disabled = true;

    const payload = {
      email: authEmailInput ? authEmailInput.value : "",
      password: authPasswordInput ? authPasswordInput.value : ""
    };
    if (authMode === "register" && authNameInput) payload.name = authNameInput.value;

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const isGitHubPages = location.hostname.endsWith(".github.io");
        throw new Error(isGitHubPages
          ? "Sign-in is unavailable on GitHub Pages because it only hosts the frontend. The Express backend must be deployed separately to enable accounts here."
          : "The account API was not found. Restart the Express server with npm start, then open http://localhost:3000.");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed.");
      setAuthenticatedUser(data.user);
      authForm.reset();
      closeAuthDialog();
    } catch (error) {
      if (authStatus) authStatus.textContent = error.message || "Could not connect to the account service.";
    } finally {
      if (authSubmitButton) authSubmitButton.disabled = false;
    }
  });
}

const profileSection =
  document.querySelector("#profile");

const editProfileButton =
  document.querySelector("#edit-profile-btn");

const profileEditCard =
  document.querySelector("#profile-edit-card");

const profileForm =
  document.querySelector("#profile-form");

const cancelProfileButton =
  document.querySelector("#cancel-profile-btn");

const profileDisplayName =
  document.querySelector("#profile-display-name");

const profileDisplayAge =
  document.querySelector("#profile-display-age");

const profileDisplayDescription =
  document.querySelector("#profile-display-description");

const profileNameInput =
  document.querySelector("#profile-name");

const profileAgeInput =
  document.querySelector("#profile-age");

const profileDescriptionInput =
  document.querySelector("#profile-description");

const profilePhotoInput = document.querySelector("#profile-photo");
const profilePhotoPreview = document.querySelector("#profile-photo-preview");
const profilePhotoStatus = document.querySelector("#profile-photo-status");
const removeProfilePhotoButton = document.querySelector("#remove-profile-photo");
const profileAvatarImage = document.querySelector(".profile-avatar img");
const topbarProfileImage = document.querySelector("#profile-btn .user-icon");
let pendingProfileAvatar = null;
const DEFAULT_AVATAR = "./resources/user.png";

const PROFILE_STORAGE_KEY =
  "myBookReaderProfile";


/* =================================
   DEFAULT PROFILE
================================= */

const defaultProfile = {
  name: "Reader",
  age: "",
  description: ""
};


/* =================================
   LOAD PROFILE
================================= */

function loadProfile() {

  const savedProfile =
    localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!savedProfile) {
    return { ...defaultProfile };
  }

  try {

    return {
      ...defaultProfile,
      ...JSON.parse(savedProfile)
    };

  } catch (error) {

    console.error(
      "Could not load profile:",
      error
    );

    return { ...defaultProfile };
  }
}


let profile = loadProfile();


/* =================================
   SAVE PROFILE
================================= */

function saveProfile() {

  localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(profile)
  );
}


/* =================================
   DISPLAY PROFILE
================================= */

function renderProfile() {

  if (!profileDisplayName) {
    return;
  }

  profileDisplayName.textContent =
    profile.name || "Reader";


  if (profile.age) {

    profileDisplayAge.textContent =
      `${profile.age} years old`;

  } else {

    profileDisplayAge.textContent =
      "Age not set";

  }


  profileDisplayDescription.textContent =
    profile.description ||
    "Tell us a little about yourself.";

  const avatar = profile.avatar || DEFAULT_AVATAR;
  if (profileAvatarImage) profileAvatarImage.src = avatar;
  if (topbarProfileImage) topbarProfileImage.src = avatar;
  if (profilePhotoPreview) profilePhotoPreview.src = avatar;
  document.querySelector(".profile-avatar")?.classList.toggle("has-photo", Boolean(profile.avatar));
}


/* =================================
   OPEN PROFILE
================================= */

if (profileButton) {

  profileButton.addEventListener(
    "click",
    () => {

      showSection("profile");
      closeMobileMenu();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

}


/* =================================
   EDIT PROFILE
================================= */

if (editProfileButton) {

  editProfileButton.addEventListener(
    "click",
    () => {

      profileNameInput.value =
        profile.name || "";

      profileAgeInput.value =
        profile.age || "";

      profileDescriptionInput.value =
        profile.description || "";

      pendingProfileAvatar = null;
      if (profilePhotoInput) profilePhotoInput.value = "";
      if (profilePhotoStatus) profilePhotoStatus.textContent = "";
      if (profilePhotoPreview) profilePhotoPreview.src = profile.avatar || DEFAULT_AVATAR;

      profileEditCard.classList.remove(
        "invisible-page"
      );

      profileEditCard.classList.add(
        "visible-page"
      );

      profileNameInput.focus();

    }
  );

}


/* =================================
   CANCEL PROFILE EDIT
================================= */

if (cancelProfileButton) {

  cancelProfileButton.addEventListener(
    "click",
    () => {

      profileEditCard.classList.remove(
        "visible-page"
      );

      profileEditCard.classList.add(
        "invisible-page"
      );

      pendingProfileAvatar = null;
      if (profilePhotoInput) profilePhotoInput.value = "";
      if (profilePhotoStatus) profilePhotoStatus.textContent = "";
      if (profilePhotoPreview) profilePhotoPreview.src = profile.avatar || DEFAULT_AVATAR;

    }
  );

}

if (profilePhotoInput) {
  profilePhotoInput.addEventListener("change", () => {
    const file = profilePhotoInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      profilePhotoStatus.textContent = "Choose an image file.";
      profilePhotoInput.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      profilePhotoStatus.textContent = "Image must be 1 MB or smaller.";
      profilePhotoInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      pendingProfileAvatar = String(reader.result);
      profilePhotoPreview.src = pendingProfileAvatar;
      profilePhotoStatus.textContent = "";
    });
    reader.addEventListener("error", () => {
      profilePhotoStatus.textContent = "Could not read this image.";
    });
    reader.readAsDataURL(file);
  });
}

if (removeProfilePhotoButton) {
  removeProfilePhotoButton.addEventListener("click", () => {
    pendingProfileAvatar = "";
    if (profilePhotoInput) profilePhotoInput.value = "";
    if (profilePhotoPreview) profilePhotoPreview.src = DEFAULT_AVATAR;
    if (profilePhotoStatus) profilePhotoStatus.textContent = "";
  });
}


/* =================================
   SAVE PROFILE FORM
================================= */

if (profileForm) {

  profileForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      profile = {

        name:
          profileNameInput.value.trim() ||
          "Reader",

        age:
          profileAgeInput.value.trim(),

        description:
          profileDescriptionInput.value.trim(),

        avatar:
          pendingProfileAvatar === null
            ? profile.avatar || ""
            : pendingProfileAvatar

      };

      pendingProfileAvatar = null;
      if (profilePhotoInput) profilePhotoInput.value = "";
      if (profilePhotoStatus) profilePhotoStatus.textContent = "";

      saveProfile();

      renderProfile();


      profileEditCard.classList.remove(
        "visible-page"
      );

      profileEditCard.classList.add(
        "invisible-page"
      );

    }
  );

}
/* =================================
   INITIALIZE PROFILE
================================= */

renderProfile();
/* =================================
   SAMPLE BOOKS
================================= */

const defaultBooks = [
  {
    id: crypto.randomUUID(),
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    pages: 304,
    currentPage: 134,
    cover: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
    description: "A story about choices, possibilities, and the lives we might have lived.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    pages: 320,
    currentPage: 70,
    cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    description: "A practical guide to building good habits and breaking bad ones.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    pages: 688,
    currentPage: 435,
    cover: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
    description: "An epic science-fiction story about power, politics, and survival on Arrakis.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    pages: 310,
    currentPage: 201,
    cover: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
    description: "Bilbo Baggins leaves his quiet life behind and joins an unexpected adventure.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    pages: 328,
    currentPage: 23,
    cover: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    description: "A dystopian novel exploring surveillance, control, and individual freedom.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Adventure",
    pages: 208,
    currentPage: 57,
    cover: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
    description: "A young shepherd travels in search of treasure while discovering his purpose.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    genre: "Fantasy",
    pages: 309,
    currentPage: 82,
    cover: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg",
    description: "A young boy discovers that he is a wizard and begins his magical education.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic",
    pages: 281,
    currentPage: 234,
    cover: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
    description: "A coming-of-age story centered on justice, morality, and prejudice.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    pages: 180,
    currentPage: 122,
    cover: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    description: "A story of wealth, love, ambition, and the American Dream.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    pages: 432,
    currentPage: 372,
    cover: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    description: "Elizabeth Bennet navigates love, family expectations, and social class.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    genre: "Classic",
    pages: 277,
    currentPage: 100,
    cover: "https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg",
    description: "A teenage boy struggles with identity, adulthood, and alienation.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    pages: 1178,
    currentPage: 10,
    cover: "https://covers.openlibrary.org/b/isbn/9780618640157-L.jpg",
    description: "An epic journey to destroy a powerful ring and defeat an ancient evil.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    genre: "Dystopian",
    pages: 249,
    currentPage: 70,
    cover: "https://covers.openlibrary.org/b/isbn/9781451678189-L.jpg",
    description: "A society where books are forbidden forces one fireman to question his world.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Book Thief",
    author: "Markus Zusak",
    genre: "Historical Fiction",
    pages: 584,
    currentPage: 256,
    cover: "https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg",
    description: "A young girl finds comfort and resistance through books during World War II.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Hunger Games",
    author: "Suzanne Collins",
    genre: "Young Adult",
    pages: 374,
    currentPage: 123,
    cover: "https://covers.openlibrary.org/b/isbn/9780439023481-L.jpg",
    description: "Katniss Everdeen is forced to compete in a brutal televised competition.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Fault in Our Stars",
    author: "John Green",
    genre: "Romance",
    pages: 313,
    currentPage: 43,
    cover: "https://covers.openlibrary.org/b/isbn/9780525478812-L.jpg",
    description: "Two teenagers meet and form a deep connection while facing difficult circumstances.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Road",
    author: "Cormac McCarthy",
    genre: "Post-Apocalyptic",
    pages: 287,
    currentPage: 56,
    cover: "https://covers.openlibrary.org/b/isbn/9780307387899-L.jpg",
    description: "A father and son travel through a devastated world searching for safety.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    genre: "Historical Fiction",
    pages: 371,
    currentPage: 189,
    cover: "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg",
    description: "A powerful story of friendship, guilt, redemption, and family.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Educated",
    author: "Tara Westover",
    genre: "Memoir",
    pages: 352,
    currentPage:245,
    cover: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
    description: "A memoir about education, family, identity, and finding independence.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Memoir",
    pages: 448,
    currentPage: 300,
    cover: "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg",
    description: "A memoir covering childhood, career, family, and life in the public eye.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Psychology of Money",
    author: "Morgan Housel",
    genre: "Finance",
    pages: 256,
    currentPage: 35,
    cover: "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
    description: "Lessons about how behavior and psychology influence financial decisions.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Deep Work",
    author: "Cal Newport",
    genre: "Productivity",
    pages: 296,
    currentPage: 10,
    cover: "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
    description: "A guide to focused work and developing the ability to concentrate deeply.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    genre: "Self-Help",
    pages: 464,
    currentPage: 81,
    cover: "https://covers.openlibrary.org/b/isbn/9781982137274-L.jpg",
    description: "A framework for personal effectiveness, responsibility, and long-term growth.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "History",
    pages: 443,
    currentPage: 96,
    cover: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
    description: "An overview of human history from early humans to the modern world.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Martian",
    author: "Andy Weir",
    genre: "Science Fiction",
    pages: 369,
    currentPage: 367,
    cover: "https://covers.openlibrary.org/b/isbn/9780553418026-L.jpg",
    description: "An astronaut stranded on Mars must use science and ingenuity to survive.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Science Fiction",
    pages: 496,
    currentPage: 293,
    cover: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
    description: "A lone astronaut awakens with a mission to save humanity from extinction.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "A Man Called Ove",
    author: "Fredrik Backman",
    genre: "Fiction",
    pages: 337,
    currentPage: 109,
    cover: "https://covers.openlibrary.org/b/isbn/9781476738017-L.jpg",
    description: "A grumpy widower's life changes when a new family moves in next door.",
    status: "finished",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Silent Patient",
    author: "Alex Michaelides",
    genre: "Thriller",
    pages: 336,
    currentPage: 206,
    cover: "https://covers.openlibrary.org/b/isbn/9781250301697-L.jpg",
    description: "A famous painter stops speaking after a shocking crime, leaving a mystery to solve.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    genre: "Historical Fiction",
    pages: 400,
    currentPage: 190,
    cover: "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
    description: "An aging Hollywood star reveals the secrets of her extraordinary life.",
    status: "current",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Circe",
    author: "Madeline Miller",
    genre: "Fantasy",
    pages: 393,
    currentPage: 30,
    cover: "https://covers.openlibrary.org/b/isbn/9780316556347-L.jpg",
    description: "A mythological retelling following the life of the goddess Circe.",
    status: "want",
    default: true
  },

  {
    id: crypto.randomUUID(),
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    genre: "Literary Fiction",
    pages: 298,
    currentPage: 100,
    cover: "https://covers.openlibrary.org/b/isbn/9780375704024-L.jpg",
    description: "A reflective story about love, loss, memory, and growing up.",
    status: "finished",
    default: true
  }
];


/* =================================
   LOAD BOOKS
================================= */


/* =================================
   LOAD BOOKS
================================= */

function loadBooks() {
  const savedBooks = localStorage.getItem(STORAGE_KEY);

  if (savedBooks) {
    try {
      const parsedBooks = JSON.parse(savedBooks);

      // Accept all saved books, not just sample books.
      if (Array.isArray(parsedBooks)) {
        return parsedBooks.map(normalizeBookProgress);
      }
    } catch (error) {
      console.error("Could not load saved books:", error);
    }
  }

  // First launch: initialize with sample books.
const initialBooks = structuredClone(defaultBooks).map(normalizeBookProgress).map(book => ({
      ...book,
      createdAt: book.createdAt || new Date().toISOString(),
      rating: book.rating || 0,
      review: book.review || ""
    }));

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialBooks)
  );

  return initialBooks;
}

function normalizeBookProgress(book) {
  const pages = Number(book.pages) || 0;
  let currentPage = Math.max(0, Number(book.currentPage) || 0);

  // Keep books explicitly on the wishlist unread during migration.
  if (book.status === "want") currentPage = 0;
  if (pages > 0) currentPage = Math.min(currentPage, pages);

  const status = currentPage === 0
    ? "want"
    : pages > 0 && currentPage >= pages
      ? "finished"
      : "current";

  return {
    ...book,
    currentPage,
    status,
    createdAt: book.createdAt || new Date().toISOString(),
    rating: Number(book.rating) || 0,
    review: book.review || ""
  };
}

let books = loadBooks();

/* =================================
   SAVE BOOKS
================================= */

function saveBooks() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(books)
  );
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderStreakWeek(activityDates = []) {
  const week = document.querySelector("#streak-week");
  const dates = new Set(activityDates);
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  const fragment = document.createDocumentFragment();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let daysRead = 0;

  weekdays.forEach((weekday, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    const dateKey = getLocalDateString(date);
    const isRead = dates.has(dateKey);
    if (isRead) daysRead += 1;

    const day = document.createElement("div");
    day.className = "streak-week-day";
    if (isRead) day.classList.add("is-read");
    if (dateKey === getLocalDateString()) day.classList.add("is-today");
    day.setAttribute("aria-label", `${weekday}, ${dateKey}: ${isRead ? "read" : "no reading recorded"}`);

    const label = document.createElement("span");
    label.className = "streak-week-label";
    label.textContent = weekday;
    const circle = document.createElement("span");
    circle.className = "streak-week-circle";
    circle.textContent = isRead ? "✓" : "";
    circle.setAttribute("aria-hidden", "true");
    day.append(label, circle);
    fragment.appendChild(day);
  });

  week.replaceChildren(fragment);
  document.querySelector("#streak-week-summary").textContent = `${daysRead} of 7 days read this week`;
}

function renderStreak(streak) {
  const weekActivityDates = streak.activityDates ||
    (streak.lastReadDate ? [streak.lastReadDate] : []);
  renderStreakWeek(weekActivityDates);
  document.querySelector("#current-streak").textContent = streak.currentStreak;
  document.querySelector("#best-streak").textContent = streak.longestStreak;
  const message = document.querySelector("#streak-message");

  if (streak.status === "broken") {
    message.textContent = `Streak ended after ${streak.lastReadDate}. Read today to start a new one.`;
    message.classList.add("streak-broken");
  } else if (streak.readToday) {
    message.textContent = "You read today. Come back tomorrow to keep it going!";
    message.classList.remove("streak-broken");
  } else if (streak.currentStreak) {
    message.textContent = "Read today to keep your streak alive.";
    message.classList.remove("streak-broken");
  } else {
    message.textContent = "Log pages read each day to build a streak.";
    message.classList.remove("streak-broken");
  }
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
}

async function loadStreak() {
  try {
    const response = await fetch(`/api/streak?today=${getLocalDateString()}`);
    if (!response.ok) throw new Error("Could not load streak");
    renderStreak(await response.json());
  } catch (error) {
    document.querySelector("#streak-message").textContent = "Streak data is unavailable. Start the server to sync your progress.";
  }
}

async function recordReadingActivity() {
  document.querySelector("#streak-message").textContent = "Saving today’s reading…";
  try {
    const response = await fetch("/api/streak/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: getLocalDateString() })
    });
    if (!response.ok) throw new Error("Could not save reading activity");
    renderStreak(await response.json());
  } catch (error) {
    document.querySelector("#streak-message").textContent = "Could not save today’s reading. Check your server connection.";
  }
}



/* =================================
   PAGE NAVIGATION
================================= */

function showSection(sectionId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(page => {
    const isSelected = page.id === sectionId;

    page.classList.toggle(
      "visible-page",
      isSelected
    );

    page.classList.toggle(
      "invisible-page",
      !isSelected
    );
  });

  navLinks.forEach(link => {
    const isSelected =
      link.getAttribute("href") === `#${sectionId}`;

    link.classList.toggle(
      "selected-section",
      isSelected
    );
  });
}

/* =================================
   MOBILE HAMBURGER MENU
================================= */

const hamburgerButton =
  document.querySelector("#hamburger-btn");

const sidebar =
  document.querySelector(".sidebar");


function openMobileMenu() {

  sidebar.classList.add(
    "mobile-open"
  );

  hamburgerButton.classList.add(
    "menu-open"
  );

  hamburgerButton.setAttribute(
    "aria-expanded",
    "true"
  );
  hamburgerButton.setAttribute("aria-label", "Close navigation menu");

}


function closeMobileMenu() {

  sidebar.classList.remove(
    "mobile-open"
  );

  hamburgerButton.classList.remove(
    "menu-open"
  );

  hamburgerButton.setAttribute(
    "aria-expanded",
    "false"
  );
  hamburgerButton.setAttribute("aria-label", "Open navigation menu");

}


function toggleMobileMenu() {

  const isOpen =
    sidebar.classList.contains(
      "mobile-open"
    );

  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }

}


if (hamburgerButton && sidebar) {

  hamburgerButton.addEventListener(
    "click",
    toggleMobileMenu
  );

}

/* =================================
   LOGO → DASHBOARD
================================= */

const logoButton = document.querySelector("#logo-btn");
const mobileMenuHeader = document.querySelector("#mobile-menu-header");
const sidebarTitle = document.querySelector(".sidebar > h2");
let logoPlaceholder = null;
let profilePlaceholder = null;
let titlePlaceholder = null;

function placeBrandControlsForViewport() {
  const isMobile = window.matchMedia("(max-width: 650px)").matches;

  if (isMobile) {
    if (logoButton.parentElement !== mobileMenuHeader) {
      logoPlaceholder = document.createComment("logo topbar position");
      logoButton.before(logoPlaceholder);
      mobileMenuHeader.appendChild(logoButton);
    }
    if (sidebarTitle.parentElement !== mobileMenuHeader) {
      titlePlaceholder = document.createComment("sidebar title position");
      sidebarTitle.before(titlePlaceholder);
      mobileMenuHeader.appendChild(sidebarTitle);
    }
    if (profileButton.parentElement !== mobileMenuHeader) {
      profilePlaceholder = document.createComment("profile topbar position");
      profileButton.before(profilePlaceholder);
      mobileMenuHeader.appendChild(profileButton);
    }
    return;
  }

  if (logoPlaceholder?.parentNode) {
    logoPlaceholder.replaceWith(logoButton);
    logoPlaceholder = null;
  }
  if (titlePlaceholder?.parentNode) {
    titlePlaceholder.replaceWith(sidebarTitle);
    titlePlaceholder = null;
  }
  if (profilePlaceholder?.parentNode) {
    profilePlaceholder.replaceWith(profileButton);
    profilePlaceholder = null;
  }
}

placeBrandControlsForViewport();
window.matchMedia("(max-width: 650px)").addEventListener("change", placeBrandControlsForViewport);
window.addEventListener("resize", placeBrandControlsForViewport);

if (logoButton) {
  logoButton.addEventListener("click", event => {
    event.preventDefault();

    showSection("home");
    closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}


navLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const sectionId =
      link
        .getAttribute("href")
        .substring(1);

    showSection(sectionId);
    closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});


/* =================================
   MODAL
================================= */

function openAddBookForm() {
  editingBookId = null;

  setFormMode("add");

  addBookForm.reset();

  modalOverlay.classList.remove(
    "invisible-page"
  );

  modalOverlay.classList.add(
    "visible-page"
  );

  document
    .querySelector("#book-title")
    .focus();
}


function closeAddBookForm() {
  modalOverlay.classList.remove(
    "visible-page"
  );

  modalOverlay.classList.add(
    "invisible-page"
  );

  addBookForm.reset();

  editingBookId = null;
}


addBookButtons.forEach(button => {
  button.addEventListener(
    "click",
    openAddBookForm
  );
});


discardButton.addEventListener(
  "click",
  closeAddBookForm
);


/* =================================
   FORM MODE
================================= */

function setFormMode(mode) {
  const modalTitle =
    modalOverlay.querySelector(".modal-title");

  const submitButton =
    modalOverlay.querySelector("#save-book-btn");

  if (mode === "edit") {

    if (modalTitle) {
      modalTitle.textContent = "Edit Book";
    }

    if (submitButton) {
      submitButton.textContent = "Save Changes";
    }

  } else {

    if (modalTitle) {
      modalTitle.textContent = "Add Book";
    }

    if (submitButton) {
      submitButton.textContent = "Add Book";
    }
  }
}


/* =================================
   GET FORM DATA
================================= */

function getBookFromForm() {
  const pages =
    Number(
      document.querySelector("#book-pages").value
    );

  let currentPage =
    Number(
      document.querySelector("#book-current-page").value
    );

  const ratingValue = Number(document.querySelector("#book-rating").value || 0);
  const reviewValue = String(document.querySelector("#book-review").value || "").trim();

  /*
     Make sure current page is valid.
  */

  if (currentPage < 0) {
    currentPage = 0;
  }

  if (currentPage > pages) {
    currentPage = pages;
  }

  
  /*
     Automatically determine status
     based on reading progress.
  */

  const status = currentPage === 0
    ? "want"
    : currentPage >= pages
      ? "finished"
      : "current";

  return {

    title:
      document
        .querySelector("#book-title")
        .value
        .trim(),

    author:
      document
        .querySelector("#book-author")
        .value
        .trim(),

    genre:
      document
        .querySelector("#book-genre")
        .value
        .trim(),

    pages,

    currentPage,

    status,

    rating: Number.isFinite(ratingValue) ? Math.max(0, Math.min(5, ratingValue)) : 0,
    review: reviewValue,

    cover:
      document
        .querySelector("#book-cover")
        .value
        .trim(),

    description:
      document
        .querySelector("#book-description")
        .value
        .trim()

  };
}


/* =================================
   FILL EDIT FORM
================================= */

function fillEditForm(book) {

  document.querySelector("#book-title").value =
    book.title;

  document.querySelector("#book-author").value =
    book.author;

  document.querySelector("#book-genre").value =
    book.genre;

  document.querySelector("#book-pages").value =
    book.pages;

  document.querySelector("#book-current-page").value =
    book.currentPage || 0;

  document.querySelector("#book-cover").value =
    book.cover || "";

  document.querySelector("#book-description").value =
    book.description || "";

  document.querySelector("#book-rating").value = String(book.rating || 0);
  document.querySelector("#book-review").value = book.review || "";

  const statusRadio =
    document.querySelector(
      `input[name="book-status"][value="${book.status}"]`
    );

  if (statusRadio) {
    statusRadio.checked = true;
  }
}


/* =================================
   OPEN EDIT FORM
================================= */

function openEditBookForm(bookId) {
  const book = books.find(
    book => book.id === bookId
  );

  if (!book) {
    return;
  }

  editingBookId = bookId;

  setFormMode("edit");

  fillEditForm(book);

  modalOverlay.classList.remove(
    "invisible-page"
  );

  modalOverlay.classList.add(
    "visible-page"
  );

  document
    .querySelector("#book-title")
    .focus();
}


/* =================================
   CREATE BOOK COVER
================================= */

function createBookCover(book, className = "") {
  const cover =
    document.createElement("div");

  cover.classList.add("cover");

  if (className) {
    cover.classList.add(className);
  }

  if (book.cover) {
    cover.style.backgroundImage =
      `url("${book.cover}")`;
  } else {
    cover.style.background = "linear-gradient(135deg, #5d3b25, #c79d64)";
    cover.style.position = "relative";
    cover.style.display = "grid";
    cover.style.placeItems = "center";
    cover.style.color = "#FAEFDD";
    cover.style.fontWeight = "700";
    cover.style.fontSize = "18px";
    cover.textContent = "BOOK";
  }

  return cover;
}


/* =================================
   CREATE TEXT ELEMENT
================================= */

function createTextElement(
  tag,
  text,
  className = ""
) {
  const element =
    document.createElement(tag);

  element.textContent = text;

  if (className) {
    element.classList.add(className);
  }

  return element;
}


/* =================================
   CREATE EDIT BUTTON
================================= */

function createEditButton(book) {
  const button =
    document.createElement("button");

  button.type = "button";

  button.classList.add(
    "edit-book-btn"
  );

  button.textContent = "Edit";

  button.addEventListener(
    "click",
    () => {
      openEditBookForm(book.id);
    }
  );

  return button;
}

function createDeleteButton(bookId) {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("delete-book-btn");
  button.textContent = "Delete";
  button.addEventListener("click", () => {
    const index = books.findIndex(book => book.id === bookId);
    if (index === -1) return;
    books.splice(index, 1);
    saveBooks();
    renderBooks();
  });
  return button;
}

function createProgressControl(book) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("mini-progress-control");

  const label = document.createElement("label");
  label.textContent = "Update progress";

  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = String(book.pages || 1);
  input.value = String(book.currentPage || 0);

  const value = document.createElement("span");
  value.textContent = `${book.currentPage || 0} / ${book.pages || 0}`;

  input.addEventListener("input", () => {
    const updated = Number(input.value);
    value.textContent = `${updated} / ${book.pages || 0}`;
  });

  input.addEventListener("change", () => {
    const current = Number(input.value);
    const bookIndex = books.findIndex(item => item.id === book.id);
    if (bookIndex === -1) return;
    const previousPage = Number(books[bookIndex].currentPage || 0);
    books[bookIndex].currentPage = Math.min(Math.max(current, 0), Number(book.pages || current));
    books[bookIndex].status = books[bookIndex].currentPage === 0 ? "want" : books[bookIndex].currentPage >= Number(book.pages || books[bookIndex].currentPage) ? "finished" : "current";
    saveBooks();
    if (books[bookIndex].currentPage > previousPage) recordReadingActivity();
    renderBooks();
  });

  wrapper.append(label, input, value);
  return wrapper;
}

function createFinishButton(book) {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("mark-finished-btn");
  button.textContent = book.status === "finished" ? "Completed" : "Mark as finished";
  button.disabled = book.status === "finished";
  button.addEventListener("click", () => {
    const bookIndex = books.findIndex(item => item.id === book.id);
    if (bookIndex === -1) return;
    books[bookIndex].status = "finished";
    books[bookIndex].currentPage = Number(books[bookIndex].pages || 0);
    saveBooks();
    renderBooks();
  });
  return button;
}


/* =================================
   BOOKSHELF
================================= */

function navigateToBook(bookId) {
  const book = books.find(item => item.id === bookId);
  if (!book) return;

  const destinations = {
    current: { section: "current", selector: ".reading-card" },
    want: { section: "want", selector: ".want-card" },
    finished: { section: "finished", selector: ".finished-card" }
  };
  const destination = destinations[book.status];
  if (!destination) return;

  showSection(destination.section);
  closeMobileMenu();

  const target = [...document.querySelectorAll(destination.selector)]
    .find(card => card.dataset.bookId === bookId);
  if (!target) return;

  target.hidden = false;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("book-navigation-highlight");
    setTimeout(() => target.classList.remove("book-navigation-highlight"), 1400);
  });
}

function addBookToBookshelf(book) {
  const bookTile =
    document.createElement("div");

  bookTile.classList.add(
    "book-tile"
  );

  bookTile.dataset.bookId = book.id;
  bookTile.setAttribute("role", "button");
  bookTile.tabIndex = 0;
  const statusLabel = book.status === "current"
    ? "currently reading"
    : book.status === "finished" ? "finished" : "wishlist";
  bookTile.setAttribute("aria-label", `${book.title}, ${statusLabel}. Open book`);
  bookTile.addEventListener("click", () => navigateToBook(book.id));
  bookTile.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToBook(book.id);
    }
  });

  bookTile.dataset.genre =
  book.genre;

  const cover =
    createBookCover(book);

  const title =
    createTextElement(
      "b",
      book.title
    );

  bookTile.appendChild(cover);
  bookTile.appendChild(title);

  const addTile =
    bookshelfGrid.querySelector(
      ".add-tile"
    );

  if (addTile) {
    bookshelfGrid.insertBefore(
      bookTile,
      addTile.nextSibling
    );
  } else {
    bookshelfGrid.appendChild(
      bookTile
    );
  }
}


/* =================================
   CURRENT READS
================================= */

function addBookToCurrentReads(book) {

  const card =
    document.createElement("article");

  card.classList.add(
    "reading-card"
  );

  card.dataset.bookId = book.id;

  card.dataset.genre =
  book.genre;

  const cover =
    createBookCover(
      book,
      "large-cover"
    );

  const info =
    document.createElement("div");

  info.classList.add(
    "reading-info"
  );


  /* ==============================
     BOOK INFORMATION
  ============================== */

  const title =
    createTextElement(
      "h2",
      book.title
    );

  const author =
    createTextElement(
      "p",
      book.author
    );

  const genre =
    createTextElement(
      "p",
      book.genre
    );

  const description =
    createTextElement(
      "p",
      book.description,
      "description"
    );

  const ratingText = book.rating ? `Rating: ${book.rating}/5` : "No rating yet";
  const rating = createTextElement("p", ratingText, "book-rating");

  /* ==============================
     READING PROGRESS
  ============================== */

  const currentPage =
    Number(book.currentPage || 0);

  const totalPages =
    Number(book.pages || 1);

  const percentage =
    Math.min(
      100,
      Math.round(
        (currentPage / totalPages) * 100
      )
    );


  const progress =
    document.createElement("div");

  progress.classList.add(
    "progress"
  );

  const progressBar =
    document.createElement("span");
  
  progressBar.style.width =
    `${percentage}%`;

  progress.appendChild(
    progressBar
  );


  const progressLabels =
    document.createElement("div");

  progressLabels.classList.add(
    "progress-labels"
  );


  const pageLabel =
    createTextElement(
      "span",
      `${currentPage} / ${totalPages} pages`
    );


  const percentLabel =
    createTextElement(
      "span",
      `${percentage}%`
    );


  progressLabels.appendChild(
    pageLabel
  );

  progressLabels.appendChild(
    percentLabel
  );


  /* ==============================
     BOOKMARK PAGE
  ============================== */

  const bookmarkArea =
    document.createElement("div");

  bookmarkArea.classList.add(
    "bookmark-area"
  );

  const progressControl = createProgressControl(book);


  const bookmarkLabel =
    createTextElement(
      "label",
      "Current Page"
    );


  const bookmarkControls =
    document.createElement("div");

  bookmarkControls.classList.add(
    "bookmark-controls"
  );


  const pageInput =
    document.createElement("input");

  pageInput.type = "number";

  pageInput.min = "0";

  pageInput.max =
    totalPages;

  pageInput.value =
    currentPage;

  pageInput.classList.add(
    "bookmark-page-input"
  );


  const bookmarkButton =
    document.createElement("button");

  bookmarkButton.type =
    "button";

  bookmarkButton.classList.add(
    "bookmark-btn"
  );

  bookmarkButton.textContent =
    "Bookmark Page";


  bookmarkButton.addEventListener(
    "click",
    () => {

      let newPage =
        Number(pageInput.value);

      /*
         Keep the page within
         valid boundaries.
      */

      if (newPage < 0) {
        newPage = 0;
      }

      if (newPage > totalPages) {
        newPage = totalPages;
      }


      /*
         Find the actual book.
      */

      const bookIndex =
        books.findIndex(
          item =>
            item.id === book.id
        );

      if (bookIndex === -1) {
        return;
      }

      const previousPage = Number(books[bookIndex].currentPage || 0);

      /*
         Update page.
      */

      books[bookIndex].currentPage =
        newPage;


      /*
         Automatically determine
         the book's status.
      */

      if (newPage >= totalPages) {

        books[bookIndex].currentPage =
          totalPages;

        books[bookIndex].status =
          "finished";

      } else if (newPage === 0) {

        books[bookIndex].status = "want";

      } else {

        books[bookIndex].status =
          "current";

      }


      /*
         Save and completely
         re-render the library.
      */

      saveBooks();

      if (newPage > previousPage) recordReadingActivity();

      renderBooks();

    }
  );


  bookmarkControls.appendChild(
    pageInput
  );

  bookmarkControls.appendChild(
    bookmarkButton
  );


  bookmarkArea.appendChild(
    bookmarkLabel
  );

  bookmarkArea.appendChild(
    bookmarkControls
  );


  /* ==============================
     EDIT BUTTON
  ============================== */

  const editButton =
    createEditButton(book);
  const deleteButton = createDeleteButton(book.id);
  const finishButton = createFinishButton(book);

  /* ==============================
     BUILD CARD
  ============================== */

  info.appendChild(title);

  info.appendChild(author);

  info.appendChild(genre);

  info.appendChild(description);
  info.appendChild(rating);

  info.appendChild(progress);

  info.appendChild(progressLabels);
  info.appendChild(progressControl);
  info.appendChild(bookmarkArea);

  info.appendChild(finishButton);
  info.appendChild(editButton);
  info.appendChild(deleteButton);


  card.appendChild(cover);

  card.appendChild(info);


  readingList.appendChild(card);
}


/* =================================
   WANT TO READ
================================= */

function addBookToWantList(book) {
  const card =
    document.createElement("article");

  card.classList.add(
    "want-card"
  );

  card.dataset.bookId = book.id;

  card.dataset.genre =
  book.genre;

  const cover =
    createBookCover(
      book,
      "medium-cover"
    );

  const info =
    document.createElement("div");

  const title =
    createTextElement(
      "h2",
      book.title
    );

  const author =
    createTextElement(
      "p",
      book.author
    );

  const genre =
    createTextElement(
      "p",
      book.genre
    );

  const description =
    createTextElement(
      "p",
      book.description,
      "description"
    );

  const pageCount =
    createTextElement(
      "span",
      `${book.pages} pages`,
      "page-count"
    );

  const editButton =
    createEditButton(book);
  const deleteButton = createDeleteButton(book.id);
  const progressControl = createProgressControl(book);
  const finishButton = createFinishButton(book);

  info.appendChild(title);
  info.appendChild(author);
  info.appendChild(genre);
  info.appendChild(description);
  info.appendChild(pageCount);
  info.appendChild(progressControl);
  info.appendChild(finishButton);
  info.appendChild(editButton);
  info.appendChild(deleteButton);

  card.appendChild(cover);
  card.appendChild(info);

  wantList.appendChild(card);
}


/* =================================
   FINISHED BOOKS
================================= */

function addBookToFinished(book) {
  const card =
    document.createElement("article");

  card.classList.add(
    "finished-card"
  );

  card.dataset.bookId = book.id;

  card.dataset.genre =
  book.genre;

  const cover =
    createBookCover(
      book,
      "finished-cover"
    );

  const title =
    createTextElement(
      "h2",
      book.title
    );

  const author =
    createTextElement(
      "p",
      book.author
    );

  const genre =
    createTextElement(
      "p",
      book.genre
    );

  const pageCount =
    createTextElement(
      "p",
      `${book.pages} pages`
    );

  const description =
    createTextElement(
      "p",
      book.description,
      "description"
    );

  const editButton =
    createEditButton(book);
  const deleteButton = createDeleteButton(book.id);
  const ratingText = book.rating ? `Rating: ${book.rating}/5` : "No rating yet";
  const rating = createTextElement("p", ratingText, "book-rating");
  const finishButton = createFinishButton(book);

  card.appendChild(cover);
  card.appendChild(title);
  card.appendChild(author);
  card.appendChild(genre);
  card.appendChild(pageCount);
  card.appendChild(description);
  card.appendChild(rating);
  card.appendChild(finishButton);
  card.appendChild(editButton);
  card.appendChild(deleteButton);

  finishedList.appendChild(card);
}


/* =================================
   DASHBOARD CURRENT BOOK
================================= */

function showDashboardCurrentBook(book) {

  if (!currentCard || !book) {
    return;
  }

  currentCard.dataset.bookId = book.id;
  currentCard.setAttribute("role", "button");
  currentCard.tabIndex = 0;
  currentCard.setAttribute("aria-label", `${book.title}, currently reading. Open in Current Reads`);
  if (currentCard.dataset.navigationBound !== "true") {
    currentCard.addEventListener("click", () => {
      navigateToBook(currentCard.dataset.bookId);
    });
    currentCard.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToBook(currentCard.dataset.bookId);
      }
    });
    currentCard.dataset.navigationBound = "true";
  }

  const cover =
    currentCard.querySelector(".cover");

  const title =
    currentCard.querySelector("h2");

  const author =
    currentCard.querySelector(".book-author");

  const genre =
    currentCard.querySelector(".book-genre");

  const description =
    currentCard.querySelector(".description");

  const pageCount =
    currentCard.querySelector(".pages");

  const progressBar =
    currentCard.querySelector(
      ".progress span"
    );

  const progressLabels =
    currentCard.querySelectorAll(
      ".progress-labels span"
    );


  const currentPage =
    Number(book.currentPage || 0);

  const totalPages =
    Number(book.pages || 1);

  const percentage =
    Math.min(
      100,
      Math.round(
        (currentPage / totalPages) * 100
      )
    );


  if (cover) {

    cover.style.backgroundImage =
      book.cover
        ? `url("${book.cover}")`
        : "";

  }


  if (title) {
    title.textContent =
      book.title;
  }


  if (author) {
    author.textContent =
      book.author;
  }


  if (genre) {
    genre.textContent =
      book.genre;
  }


  if (description) {
    description.textContent =
      book.description;
  }


  if (pageCount) {

    pageCount.textContent =
      `${currentPage} / ${totalPages} pages`;

  }


  if (progressBar) {

    progressBar.style.width =
      `${percentage}%`;

  }


  if (progressLabels.length >= 2) {

    progressLabels[0].textContent =
      `${percentage}%`;

    progressLabels[1].textContent =
      `${currentPage} / ${totalPages} pages`;

  }
}


/* =================================
   UPDATE BOOK COUNTS
================================= */

function updateBookCounts() {
  const bookshelfCount =
    document.querySelector(
      "#bookshelf-count"
    );

  const currentCount =
    document.querySelector(
      "#current-count"
    );

  const wantCount =
    document.querySelector(
      "#want-count"
    );

  const finishedCount =
    document.querySelector(
      "#finished-count"
    );

  const currentBooks =
    books.filter(
      book => book.status === "current"
    );

  const wantBooks =
    books.filter(
      book => book.status === "want"
    );

  const finishedBooks =
    books.filter(
      book => book.status === "finished"
    );

  if (bookshelfCount) {
    bookshelfCount.textContent =
      `${books.length} ${
        books.length === 1
          ? "book"
          : "books"
      }`;
  }

  if (currentCount) {
    currentCount.textContent =
      `${currentBooks.length} ${
        currentBooks.length === 1
          ? "book"
          : "books"
      }`;
  }

  if (wantCount) {
    wantCount.textContent =
      `${wantBooks.length} ${
        wantBooks.length === 1
          ? "book"
          : "books"
      }`;
  }

  if (finishedCount) {
    finishedCount.textContent =
      `${finishedBooks.length} ${
        finishedBooks.length === 1
          ? "book"
          : "books"
      }`;
  }
}

/* =================================
   UPDATE DASHBOARD STATISTICS
================================= */

function updateDashboardStats() {
  const booksReadStat =
    document.querySelector("#books-read-stat");

  const totalBooksStat =
    document.querySelector("#total-books-stat");

  const currentReadsStat =
    document.querySelector("#current-reads-stat");

  const wantToReadStat =
    document.querySelector("#want-to-read-stat");

  const totalPagesReadStat = document.querySelector("#total-pages-read-stat");
  const favoriteGenreStat = document.querySelector("#favorite-genre-stat");
  const booksPerMonthStat = document.querySelector("#books-per-month-stat");
  const yearlyGoalBar = document.querySelector("#yearly-goal-bar");
  const yearlyGoalStatus = document.querySelector("#yearly-goal-status");

  const booksRead = books.filter(book => book.status === "finished").length;
  const totalBooks = books.length;
  const currentReads = books.filter(book => book.status === "current").length;
  const wantToRead = books.filter(book => book.status === "want").length;
  const totalPagesRead = books.reduce((sum, book) => sum + Math.min(Number(book.currentPage || 0), Number(book.pages || 0)), 0);

  const genreCounts = books.reduce((counts, book) => {
    if (!book.genre) return counts;
    counts[book.genre] = (counts[book.genre] || 0) + 1;
    return counts;
  }, {});

  const favoriteGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
  const booksThisMonth = books.filter(book => {
    if (!book.createdAt) return false;
    const d = new Date(book.createdAt);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  }).length;

  const yearlyGoalTarget = 52;
  const yearlyProgress = Math.min(100, (booksRead / yearlyGoalTarget) * 100);

  if (booksReadStat) booksReadStat.textContent = booksRead;
  if (totalBooksStat) totalBooksStat.textContent = totalBooks;
  if (currentReadsStat) currentReadsStat.textContent = currentReads;
  if (wantToReadStat) wantToReadStat.textContent = wantToRead;
  if (totalPagesReadStat) totalPagesReadStat.textContent = totalPagesRead;
  if (favoriteGenreStat) favoriteGenreStat.textContent = favoriteGenre ? favoriteGenre[0] : "—";
  if (booksPerMonthStat) booksPerMonthStat.textContent = booksThisMonth;
  if (yearlyGoalBar) yearlyGoalBar.style.width = `${yearlyProgress}%`;
  if (yearlyGoalStatus) yearlyGoalStatus.textContent = `${booksRead} / ${yearlyGoalTarget} books completed`;
}

/* =================================
   GENRE FILTERS
================================= */

const genreFilters =
  document.querySelectorAll(
    ".genre-filter-select"
  );

const sortFilters = document.querySelectorAll(".sort-filter-select");

function getSortedBooks(list) {
  const selected = document.querySelector("#bookshelf-sort-filter")?.value || "recent";
  const sorted = [...list];

  switch (selected) {
    case "title":
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;
    case "author":
      sorted.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
      break;
    case "progress":
      sorted.sort((a, b) => Number(b.currentPage || 0) - Number(a.currentPage || 0));
      break;
    case "recent":
    default:
      sorted.sort((a, b) => Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0)));
      break;
  }

  return sorted;
}

/* =================================
   GET AVAILABLE GENRES
================================= */

function getAvailableGenres() {

  return [
    ...new Set(
      books
        .map(book => book.genre)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );
}


/* =================================
   POPULATE GENRE FILTERS
================================= */

function populateGenreFilters() {

  const genres =
    getAvailableGenres();

  genreFilters.forEach(select => {

    /*
       Remember the currently
       selected genre.
    */

    const previousValue =
      select.value || "all";


    /*
       Clear existing options.
    */

    select.innerHTML = "";


    /*
       Add "All Genres".
    */

    const allOption =
      document.createElement("option");

    allOption.value = "all";
    allOption.textContent =
      "All Genres";

    select.appendChild(allOption);


    /*
       Add every genre found
       in the book collection.
    */

    genres.forEach(genre => {

      const option =
        document.createElement("option");

      option.value = genre;
      option.textContent = genre;

      select.appendChild(option);

    });


    /*
       Restore the previous selection
       if that genre still exists.
    */

    const genreStillExists =
      [...select.options].some(
        option =>
          option.value === previousValue
      );

    select.value =
      genreStillExists
        ? previousValue
        : "all";

  });
}


/* =================================
   FILTER BOOKS BY GENRE
================================= */

function filterBooksByGenre(
  section,
  genre
) {

  /*
     MY BOOKSHELF
  */

  if (section === "bookshelf") {

    const bookTiles =
      bookshelfGrid.querySelectorAll(
        ".book-tile:not(.add-tile)"
      );

    bookTiles.forEach(tile => {

      const bookGenre =
        tile.dataset.genre;

      tile.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }


  /*
     CURRENT READS
  */

  if (section === "current") {

    const cards =
      readingList.querySelectorAll(
        ".reading-card"
      );

    cards.forEach(card => {

      const bookGenre =
        card.dataset.genre;

      card.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }


  /*
     WANT TO READ
  */

  if (section === "want") {

    const cards =
      wantList.querySelectorAll(
        ".want-card"
      );

    cards.forEach(card => {

      const bookGenre =
        card.dataset.genre;

      card.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }


  /*
     FINISHED BOOKS
  */

  if (section === "finished") {

    const cards =
      finishedList.querySelectorAll(
        ".finished-card"
      );

    cards.forEach(card => {

      const bookGenre =
        card.dataset.genre;

      card.hidden =
        genre !== "all" &&
        bookGenre !== genre;

    });

  }
}


/* =================================
   FILTER CHANGE EVENT
================================= */

genreFilters.forEach(select => {

  select.addEventListener(
    "change",
    () => {

      filterBooksByGenre(
        select.dataset.section,
        select.value
      );

    }
  );

});

sortFilters.forEach(select => {
  select.addEventListener("change", () => {
    renderBooks();
  });
});

/* =================================
   RENDER ALL BOOKS
================================= */

function renderBooks() {

  /*
     Remove generated bookshelf books
  */

  bookshelfGrid
    .querySelectorAll(
      ".book-tile:not(.add-tile)"
    )
    .forEach(bookTile => {
      bookTile.remove();
    });


  /*
     Clear status sections
  */

  readingList.innerHTML = "";
  wantList.innerHTML = "";
  finishedList.innerHTML = "";


  /*
     Render every book
     into My Bookshelf
  */

  const visibleBooks = getSortedBooks(books);

  visibleBooks.forEach(book => {
    addBookToBookshelf(book);
  });


  /*
     Render books according
     to their current status
  */

  books.forEach(book => {

    switch (book.status) {

      case "current":
        addBookToCurrentReads(book);
        break;

      case "want":
        addBookToWantList(book);
        break;

      case "finished":
        addBookToFinished(book);
        break;

    }

  });


  /*
     Update counts once
  */

  updateBookCounts();
  updateDashboardStats();
  populateGenreFilters();

  genreFilters.forEach(select => {

    filterBooksByGenre(
      select.dataset.section,
      select.value
    );

  });

  /*
     Pick a random CURRENT book
     for the dashboard.

     This does NOT change the
     book's actual status.
  */

  const currentBooks =
    books.filter(
      book => book.status === "current"
    );

  if (currentBooks.length > 0) {

    const randomBook =
      currentBooks[
        Math.floor(
          Math.random() *
          currentBooks.length
        )
      ];

    showDashboardCurrentBook(
      randomBook
    );

  }
}


/* =================================
   ADD / EDIT BOOK
================================= */

addBookForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const formBook =
      getBookFromForm();


    /* =================================
       EDIT EXISTING BOOK
    ================================= */

    if (editingBookId) {

      const bookIndex =
        books.findIndex(
          book =>
            book.id === editingBookId
        );

      if (bookIndex !== -1) {

        /*
           Preserve the original
           "default: true" property.

           Therefore, editing one of
           the six original books still
           saves it permanently.
        */

        books[bookIndex] = {
          ...books[bookIndex],
          ...formBook
        };

      }

    }


    /* =================================
       ADD NEW BOOK
    ================================= */

    else {

      /*
         IMPORTANT:
         No "default: true" here.

         This means newly added books
         exist only for this session.
      */

      books.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...formBook
      });

    }


    /*
       Only default/sample books
       are saved to localStorage.
    */

    saveBooks();


    /*
       Update the screen.
    */

    renderBooks();


    /*
       Close the modal.
    */

    closeAddBookForm();

  }
);

/* =================================
   STAT CARD NAVIGATION
================================= */

const statCards =
  document.querySelectorAll(".stat-card");

statCards.forEach(card => {

  card.addEventListener("click", () => {

    const sectionId =
      card.dataset.section;

    if (!sectionId) {
      return;
    }

    showSection(sectionId);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});


/* =================================
   SEARCH OVERLAY CONTROLS
================================= */

const searchBtn = document.getElementById("search-btn");
const searchOverlay = document.getElementById("search-overlay");
const closeSearchBtn = document.getElementById("close-search-btn");
const bookSearchInput = document.getElementById("book-search-input");
const searchResults = document.getElementById("search-results");
const mobileBookSearchInput = document.getElementById("mobile-book-search-input");
const mobileSearchResults = document.getElementById("mobile-search-results");
let searchRequestController;
let searchDebounce;

function showSearchMessage(message, target = searchResults) {
  if (target === mobileSearchResults) target.hidden = false;
  const status = document.createElement("p");
  status.className = "search-empty-state";
  status.textContent = message;
  target.replaceChildren(status);
}

function renderSearchResults(books, target = searchResults) {
  if (!books.length) {
    showSearchMessage("No books found. Try another title, author, or genre.", target);
    return;
  }

  const fragment = document.createDocumentFragment();
  books.forEach(book => {
    const result = document.createElement("article");
    result.className = "search-result-card";

    const cover = document.createElement("div");
    cover.className = "search-result-cover";
    if (book.cover) cover.style.backgroundImage = `url("${book.cover}")`;
    cover.setAttribute("aria-hidden", "true");

    const details = document.createElement("div");
    details.className = "search-result-details";
    const title = document.createElement("h3");
    title.textContent = book.title;
    const metadata = document.createElement("p");
    metadata.textContent = [book.author, book.genre].filter(Boolean).join(" · ");

    details.append(title, metadata);
    result.append(cover, details);
    fragment.append(result);
  });

  if (target === mobileSearchResults) target.hidden = false;
  target.replaceChildren(fragment);
}

async function searchBooks(query, target = searchResults) {
  searchRequestController?.abort();
  if (!query) {
    if (target === mobileSearchResults) {
      target.replaceChildren();
      target.hidden = true;
    } else {
      showSearchMessage("Start typing to find a book.", target);
    }
    return;
  }

  const controller = new AbortController();
  searchRequestController = controller;
  showSearchMessage("Searching your bookshelf…", target);

  try {
    const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    });
    if (!response.ok) throw new Error("Search request failed");
    const { results } = await response.json();
    if (!controller.signal.aborted) renderSearchResults(results, target);
  } catch (error) {
    if (error.name !== "AbortError") {
      showSearchMessage("Search is unavailable right now. Please try again.", target);
    }
  }
}

bookSearchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  const query = bookSearchInput.value.trim();
  searchDebounce = setTimeout(() => searchBooks(query), 180);
});

mobileBookSearchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  const query = mobileBookSearchInput.value.trim();
  searchDebounce = setTimeout(() => searchBooks(query, mobileSearchResults), 180);
});

function openSearch() {
  searchOverlay.classList.remove("invisible-page");
  searchOverlay.classList.add("visible-page");

  document.body.style.overflow = "hidden";

  bookSearchInput.focus();
  searchBooks(bookSearchInput.value.trim());
}

function closeSearch() {
  clearTimeout(searchDebounce);
  searchRequestController?.abort();
  searchOverlay.classList.remove("visible-page");
  searchOverlay.classList.add("invisible-page");

  document.body.style.overflow = "";

  searchBtn.focus();
}

searchBtn.addEventListener("click", openSearch);
closeSearchBtn.addEventListener("click", closeSearch);

// Close when clicking the dark backdrop.
searchOverlay.addEventListener("click", event => {
  if (event.target === searchOverlay) {
    closeSearch();
  }
});

// Close with Escape.
document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    searchOverlay.classList.contains("visible-page")
  ) {
    closeSearch();
  }
});


/* =================================
   INITIALIZE
================================= */

renderBooks();
loadStreak();
loadAuthState();



/* DARK MODE SETTING */
const darkModeToggle = document.getElementById("dark-mode-toggle");

if (darkModeToggle) {
  const savedTheme = localStorage.getItem("bookworm-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }

  function updateDarkModeButton() {
    const isDark = document.body.classList.contains("dark-mode");

    darkModeToggle.querySelector("span").textContent = isDark ? "\u2600" : "\u263e";
    darkModeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    darkModeToggle.title = `Switch to ${isDark ? "light" : "dark"} mode`;
    darkModeToggle.setAttribute("aria-pressed", String(isDark));
  }

  updateDarkModeButton();

  darkModeToggle.addEventListener("click", function () {
    const isDark = document.body.classList.toggle("dark-mode");

    localStorage.setItem(
      "bookworm-theme",
      isDark ? "dark" : "light"
    );

    updateDarkModeButton();
  });
}
// LOG OUT: OPEN THE LOGIN DIALOG
document.addEventListener('click', function (event) {
  const logoutButton = event.target.closest('#logout-btn');

  if (!logoutButton) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const guestPage = document.getElementById('guest-page');
  const appLayout = document.getElementById('app-layout');
  const authOverlay = document.getElementById('auth-overlay');
  const authForm = document.getElementById('auth-form');
  const authStatus = document.getElementById('auth-status');
  const authEmail = document.getElementById('auth-email');
  const accountButton = document.getElementById('account-btn');

  // Hide the dashboard and return to the guest page.
  guestPage.hidden = false;
  appLayout.hidden = true;

  document.getElementById('profile-btn').hidden = true;
  document.getElementById('search-btn').hidden = true;
  document.body.classList.remove('is-authenticated');

  // Close other overlays.
  document.getElementById('search-overlay')
    ?.classList.add('invisible-page');

  document.querySelector('.modal-overlay')
    ?.classList.add('invisible-page');

  // Reset the login form.
  authForm.reset();
  authStatus.textContent = '';

  document.getElementById('auth-title').textContent = 'Log in';
  document.getElementById('auth-submit-btn').textContent = 'Log in';
  document.getElementById('auth-name-group').hidden = true;
  document.getElementById('auth-switch-prompt').textContent =
    'Need an account?';
  document.getElementById('auth-switch-btn').textContent = 'Create one';

  accountButton.textContent = 'Log in';

  // Force the login dialog to appear.
  authOverlay.hidden = false;
  authOverlay.classList.remove('invisible-page');
  authOverlay.style.cssText += `
    display: flex !important;
    position: fixed !important;
    inset: 0 !important;
    z-index: 99999 !important;
    align-items: center !important;
    justify-content: center !important;
  `;

  history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search
  );

  window.scrollTo(0, 0);
  authEmail.focus();
}, true);

/*- GUEST ACCESS AND TIME-BASED GREETING */
  
    (() => {
      const guestPage = document.getElementById('guest-page');
      const appLayout = document.getElementById('app-layout');

      const profileButton = document.getElementById('profile-btn');
      const searchButton = document.getElementById('search-btn');

      const authOverlay = document.getElementById('auth-overlay');
      const authForm = document.getElementById('auth-form');
      const authStatus = document.getElementById('auth-status');

      const authName = document.getElementById('auth-name');
      const authEmail = document.getElementById('auth-email');

      const loginButton = document.getElementById('guest-login-btn');
      const accountButton = document.getElementById('account-btn');
      const closeAuthButton = document.getElementById('close-auth-btn');

      const homeTitle = document.getElementById('home-title');

      let loginSubmitted = false;

      function greetingForNow() {
        const hour = new Date().getHours();

        if (hour < 12) {
          return 'Good morning';
        }

        if (hour < 17) {
          return 'Good afternoon';
        }

        return 'Good evening';
      }

      function getReaderName() {
        const accountName = authenticatedUser?.name?.trim();
        const profileName = document
          .getElementById('profile-display-name')
          ?.textContent
          ?.trim();

        const enteredName = authName?.value?.trim();
        const email = authEmail?.value?.trim();

        if (accountName) {
          return accountName;
        }

        if (profileName && profileName.toLowerCase() !== 'reader') {
          return profileName;
        }

        if (enteredName) {
          return enteredName;
        }

        if (email && email.includes('@')) {
          return email.split('@')[0];
        }

        return 'Reader';
      }

      function showAuthenticatedApp() {
        guestPage.hidden = true;
        appLayout.hidden = false;

        profileButton.hidden = false;
        searchButton.hidden = false;

        homeTitle.textContent =
          `${greetingForNow()}, ${getReaderName()}!`;

        document.body.classList.add('is-authenticated');
      }

      function showGuestPage() {
        guestPage.hidden = false;
        appLayout.hidden = true;

        profileButton.hidden = true;
        searchButton.hidden = true;

        document.body.classList.remove('is-authenticated');
      }

      // Start in guest mode.
      showGuestPage();

      // Open the existing login dialog.
      loginButton?.addEventListener('click', () => {
        openAuthDialog();
      });

      // Check whether submitting the login form closes the dialog.
      authForm?.addEventListener('submit', () => {
        loginSubmitted = true;

        window.setTimeout(() => {
          if (
            loginSubmitted &&
            authOverlay.classList.contains('invisible-page')
          ) {
            const status = authStatus?.textContent?.trim() || '';

            if (!/invalid|incorrect|failed|error|required|unable/i.test(status)) {
              showAuthenticatedApp();
              loginSubmitted = false;
            }
          }
        }, 250);
      });

      // Detect when the existing authentication script closes the dialog.
      const authObserver = new MutationObserver(() => {
        if (
          loginSubmitted &&
          authOverlay.classList.contains('invisible-page')
        ) {
          window.setTimeout(() => {
            const status = authStatus?.textContent?.trim() || '';

            if (
              loginSubmitted &&
              authOverlay.classList.contains('invisible-page') &&
              !/invalid|incorrect|failed|error|required|unable/i.test(status)
            ) {
              showAuthenticatedApp();
              loginSubmitted = false;
            }
          }, 100);
        }
      });

      authObserver.observe(authOverlay, {
        attributes: true,
        attributeFilter: ['class']
      });

      // Closing the login dialog without submitting keeps the app hidden.
      closeAuthButton?.addEventListener('click', () => {
        loginSubmitted = false;
      });

      // LOG OUT AND RETURN TO THE HOMEPAGE
      const logoutButton = document.getElementById('logout-btn');

      logoutButton?.addEventListener('click', () => {
        // Return to the guest homepage and hide the private app pages.
        showGuestPage();

        // Close login and search overlays.
        authOverlay.classList.add('invisible-page');
        document.getElementById('search-overlay')
          ?.classList.add('invisible-page');

        // Reset the login submission state and account button.
        loginSubmitted = false;

        if (accountButton) {
          accountButton.textContent = 'Log in';
        }

        // Clear the URL hash and return to the top of the homepage.
        history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });

      // Update the greeting every minute.
      window.setInterval(() => {
        if (!appLayout.hidden) {
          homeTitle.textContent =
            `${greetingForNow()}, ${getReaderName()}!`;
        }
      }, 60000);
    })();


