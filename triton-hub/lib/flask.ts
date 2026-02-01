/**
 * Utility functions for interacting with the Flask backend
 */

export interface FlaskUser {
    email: string;
    family_name: string;
    given_name: string;
    hd: string;
    id: string;
    locale: string;
    name: string;
    picture: string;
    verified_email: boolean;
}

export interface FlaskAuthStatus {
    authenticated: boolean;
    user?: FlaskUser;
}

/**
 * Checks the authentication status of the user on the Flask backend.
 * Uses the proxy defined in next.config.ts (/api/flask -> localhost:3000/api)
 */
export async function getFlaskAuthStatus(): Promise<FlaskAuthStatus> {
    try {
        const response = await fetch('/api/flask/auth/google/me', {
            credentials: 'include'
        });
        if (!response.ok) {
            return { authenticated: false };
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching Flask auth status:', error);
        return { authenticated: false };
    }
}

/**
 * Logs out the user from the Flask backend (clears Google auth session).
 */
export async function logoutFlaskAuth(): Promise<boolean> {
    try {
        const response = await fetch('/api/flask/auth/google/logout', {
            credentials: 'include'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error logging out from Flask:', error);
        return false;
    }
}

/**
 * Fetches emails from the Flask backend.
 */
export async function getFlaskEmails() {
    try {
        const response = await fetch('/api/flask/emails', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch emails');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching Flask emails:', error);
        return { emails: [] };
    }
}
/**
 * Saves the Canvas access token to the Flask backend session.
 */
export async function saveCanvasToken(accessToken: string, canvasUrl: string) {
    try {
        const response = await fetch('/api/flask/auth/canvas/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                access_token: accessToken,
                canvas_url: canvasUrl
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to save Canvas token to backend');
        }
        return await response.json();
    } catch (error) {
        console.error('Error saving Canvas token:', error);
        throw error;
    }
}
