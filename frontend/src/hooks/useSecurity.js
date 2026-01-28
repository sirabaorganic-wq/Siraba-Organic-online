import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureStorage, logSecurityEvent } from '../utils/security';

/**
 * OWASP A01:2021 – Broken Access Control
 * OWASP A07:2021 – Identification and Authentication Failures
 * Custom hook for authentication and authorization
 */

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        const isValid = secureStorage.isTokenValid();
        setIsAuthenticated(isValid);

        if (isValid) {
            // Get user data from storage or API
            const userData = sessionStorage.getItem('user');
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (error) {
                    console.error('Failed to parse user data');
                    logout();
                }
            }
        }

        setLoading(false);
    };

    const login = (token, userData) => {
        secureStorage.setToken(token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        logSecurityEvent('LOGIN', { userId: userData._id });
    };

    const logout = () => {
        logSecurityEvent('LOGOUT', { userId: user?._id });
        secureStorage.clearToken();
        sessionStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    const requireAuth = (requiredRole = null) => {
        if (!isAuthenticated) {
            logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
                requiredAuth: true,
                currentPath: window.location.pathname
            });
            navigate('/login');
            return false;
        }

        if (requiredRole === 'admin' && !user?.isAdmin) {
            logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', {
                userId: user?._id,
                currentPath: window.location.pathname
            });
            navigate('/');
            return false;
        }

        return true;
    };

    return {
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        requireAuth,
        checkAuth
    };
};

/**
 * OWASP A01:2021 – Broken Access Control
 * Protected route wrapper component
 */
export const useProtectedRoute = (requiredRole = null) => {
    const { isAuthenticated, user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                logSecurityEvent('UNAUTHORIZED_ROUTE_ACCESS', {
                    path: window.location.pathname
                });
                navigate('/login');
            } else if (requiredRole === 'admin' && !user?.isAdmin) {
                logSecurityEvent('FORBIDDEN_ADMIN_ROUTE', {
                    userId: user?._id,
                    path: window.location.pathname
                });
                navigate('/');
            }
        }
    }, [isAuthenticated, user, loading, requiredRole, navigate]);

    return { isAuthenticated, user, loading };
};

/**
 * OWASP A09:2021 – Security Logging and Monitoring
 * Hook for tracking user activity
 */
export const useActivityTracker = () => {
    useEffect(() => {
        // Track page views
        logSecurityEvent('PAGE_VIEW', {
            path: window.location.pathname,
            referrer: document.referrer
        });

        // Track tab visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logSecurityEvent('TAB_HIDDEN', {});
            } else {
                logSecurityEvent('TAB_VISIBLE', {});
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
};

/**
 * OWASP A05:2021 – Security Misconfiguration
 * Hook for HTTPS enforcement
 */
export const useHTTPSEnforcement = () => {
    useEffect(() => {
        if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
            logSecurityEvent('HTTP_TO_HTTPS_REDIRECT', {
                from: window.location.href
            });

            // Redirect to HTTPS
            window.location.href = window.location.href.replace('http:', 'https:');
        }
    }, []);
};

/**
 * OWASP A07:2021 – Identification and Authentication Failures
 * Hook for session timeout
 */
export const useSessionTimeout = (timeoutMinutes = 30) => {
    const { logout } = useAuth();
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        const resetTimer = () => {
            setLastActivity(Date.now());
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        // Check for inactivity
        const interval = setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            const timeoutMs = timeoutMinutes * 60 * 1000;

            if (inactiveTime > timeoutMs) {
                logSecurityEvent('SESSION_TIMEOUT', { inactiveMinutes: timeoutMinutes });
                logout();
            }
        }, 60000); // Check every minute

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
            clearInterval(interval);
        };
    }, [lastActivity, timeoutMinutes, logout]);
};

/**
 * OWASP A09:2021 – Security Logging and Monitoring
 * Hook for detecting suspicious behavior
 */
export const useSuspiciousActivityDetector = () => {
    useEffect(() => {
        let rapidClickCount = 0;
        let rapidClickTimer = null;

        const detectRapidClicks = () => {
            rapidClickCount++;

            if (rapidClickCount > 20) {
                logSecurityEvent('SUSPICIOUS_RAPID_CLICKS', {
                    count: rapidClickCount
                });
                rapidClickCount = 0;
            }

            clearTimeout(rapidClickTimer);
            rapidClickTimer = setTimeout(() => {
                rapidClickCount = 0;
            }, 5000);
        };

        // Detect console opening (potential developer tools)
        const detectDevTools = () => {
            const threshold = 160;
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {
                logSecurityEvent('DEV_TOOLS_DETECTED', {});
            }
        };

        // Detect context menu (right-click)
        const handleContextMenu = (e) => {
            if (process.env.NODE_ENV === 'production') {
                // Optionally prevent right-click in production
                // e.preventDefault();
                logSecurityEvent('CONTEXT_MENU_OPENED', {
                    element: e.target.tagName
                });
            }
        };

        document.addEventListener('click', detectRapidClicks);
        window.addEventListener('resize', detectDevTools);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('click', detectRapidClicks);
            window.removeEventListener('resize', detectDevTools);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);
};

export default {
    useAuth,
    useProtectedRoute,
    useActivityTracker,
    useHTTPSEnforcement,
    useSessionTimeout,
    useSuspiciousActivityDetector
};
