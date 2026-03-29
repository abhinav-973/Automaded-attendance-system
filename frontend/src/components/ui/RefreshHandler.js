import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const RefreshHandler = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('http://localhost:3000/auth/me', {
                    withCredentials: true  // sends the httpOnly cookie
                });
                if (res.data.success) {
                    setIsAuthenticated(true);
                    if (location.pathname === '/login' || location.pathname === '/register') {
                        navigate('/dashboard');
                    }
                }
            } catch (error) {
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, [navigate, location, setIsAuthenticated]);

    return null;
};

export default RefreshHandler;