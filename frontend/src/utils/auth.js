const STORAGE_KEY = "loggedInUser";

const getStoredUser = () => {
    try {
        const rawValue = localStorage.getItem(STORAGE_KEY);
        return rawValue ? JSON.parse(rawValue) : null;
    } catch {
        return null;
    }
};

const setStoredUser = (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

const clearStoredUser = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export { clearStoredUser, getStoredUser, setStoredUser };
