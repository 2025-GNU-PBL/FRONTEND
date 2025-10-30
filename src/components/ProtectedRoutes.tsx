import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRoutesProps {
  isAuth: boolean;
}

const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ isAuth }) => {
  return isAuth ? <Outlet /> : <Navigate to="/log-in" />;
};

export default ProtectedRoutes;
