import { useEffect } from "react"
import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useAuth } from "../hooks/useAuth"

const ProtectedRoutes = () => {
    // get access token form loacl storage
    const {isAuthenticated} = useAuth();
    const isAuth = isAuthenticated() // true || false
    const navigate = useNavigate()


    useEffect(()=>{
        if(!isAuth){
            toast.warning("Unauthorised. You have to be logged in")
            navigate("/");
            return;
        }
    },[isAuth, navigate])

      // 🔐 Token expiration checker
    useEffect(() => {
        const interval = setInterval(() => {
            const storedToken = localStorage.getItem("accessToken");
            if (!storedToken) return;

            try {
                const token = JSON.parse(storedToken);
                const payload = JSON.parse(atob(token.split(".")[1]));
                const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp < currentTime) {
                localStorage.removeItem("accessToken");
                toast.error("Session expired. Please log in again.");
                navigate("/");
            }
            } catch (err) {
                console.error("Token parsing error", err);
                localStorage.removeItem("accessToken");
                navigate("/");
            }
        }, 60000); // check every 60 seconds

        return () => clearInterval(interval);
    }, [navigate]);

    return isAuth ? <Outlet /> : null
}

export default ProtectedRoutes