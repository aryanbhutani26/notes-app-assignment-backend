// Route configuration for the Notes App

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  NOTES: '/notes',
  NOTE_NEW: '/notes/new',
  NOTE_EDIT: '/notes/:id/edit',
  NOTE_VIEW: '/notes/:id',
  
  // Utility routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized'
};

// Route helpers
export const routeHelpers = {
  // Generate note edit route
  getNoteEditRoute: (noteId) => `/notes/${noteId}/edit`,
  
  // Generate note view route
  getNoteViewRoute: (noteId) => `/notes/${noteId}`,
  
  // Check if route is protected
  isProtectedRoute: (pathname) => {
    const protectedPaths = [
      ROUTES.DASHBOARD,
      ROUTES.NOTES,
      ROUTES.NOTE_NEW,
      '/notes/' // Any route starting with /notes/
    ];
    
    return protectedPaths.some(path => 
      pathname === path || pathname.startsWith(path)
    );
  },
  
  // Check if route is public
  isPublicRoute: (pathname) => {
    const publicPaths = [
      ROUTES.HOME,
      ROUTES.LOGIN,
      ROUTES.REGISTER,
      ROUTES.NOT_FOUND,
      ROUTES.UNAUTHORIZED
    ];
    
    return publicPaths.includes(pathname);
  },
  
  // Get redirect route after login
  getPostLoginRoute: (from) => {
    // If coming from a specific route, redirect there
    if (from && routeHelpers.isProtectedRoute(from)) {
      return from;
    }
    
    // Default to dashboard
    return ROUTES.DASHBOARD;
  },
  
  // Get redirect route after logout
  getPostLogoutRoute: () => {
    return ROUTES.LOGIN;
  }
};

// Route metadata for navigation and breadcrumbs
export const routeMetadata = {
  [ROUTES.HOME]: {
    title: 'Home',
    breadcrumb: 'Home',
    requiresAuth: false
  },
  [ROUTES.LOGIN]: {
    title: 'Login',
    breadcrumb: 'Login',
    requiresAuth: false
  },
  [ROUTES.REGISTER]: {
    title: 'Register',
    breadcrumb: 'Register',
    requiresAuth: false
  },
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    breadcrumb: 'Dashboard',
    requiresAuth: true
  },
  [ROUTES.NOTES]: {
    title: 'Notes',
    breadcrumb: 'Notes',
    requiresAuth: true
  },
  [ROUTES.NOTE_NEW]: {
    title: 'New Note',
    breadcrumb: 'New Note',
    requiresAuth: true
  },
  [ROUTES.NOTE_EDIT]: {
    title: 'Edit Note',
    breadcrumb: 'Edit Note',
    requiresAuth: true
  },
  [ROUTES.NOTE_VIEW]: {
    title: 'View Note',
    breadcrumb: 'View Note',
    requiresAuth: true
  }
};

export default ROUTES;